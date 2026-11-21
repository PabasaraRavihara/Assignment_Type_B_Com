const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Craftsman = require('../models/Craftsman');
const { ensureDbConnected } = require('../db');
let craftsmenList = require('../data/craftsmenData');

const craftsmenFilePath = path.join(__dirname, '../data/craftsmenData.js');

// Helper to save craftsmen to disk so changes are permanent even without database
const saveCraftsmenToDisk = () => {
  try {
    const content = `// All 63 verified workshop craftsmen for Ashadi Jewellers
// Ordered strictly by Seniority / Employee Number (Lowest Employ No. First)
const craftsmenList = ${JSON.stringify(craftsmenList, null, 2)};

module.exports = craftsmenList;
`;
    fs.writeFileSync(craftsmenFilePath, content, 'utf8');
  } catch (err) {
    console.error('Failed to write craftsmen to disk:', err.message);
  }
};

// GET all craftsmen with optional search and filter
router.get('/', async (req, res) => {
  const { search, skillTier, status } = req.query;

  // Ensure DB connected and sync from MongoDB Atlas
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      const dbCraftsmen = await Craftsman.find().lean();
      if (dbCraftsmen && dbCraftsmen.length > 0) {
        const map = new Map();
        craftsmenList.forEach(c => map.set(c.id, c));
        dbCraftsmen.forEach(c => map.set(c.id, c));
        craftsmenList = Array.from(map.values());
      }
    } catch (err) {
      console.log('MongoDB craftsmen fetch notice:', err.message);
    }
  }

  let results = [...craftsmenList];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) || 
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.specialization && c.specialization.toLowerCase().includes(q)) ||
      (c.empNo && String(c.empNo).toLowerCase().includes(q))
    );
  }

  if (skillTier && skillTier !== 'All') {
    results = results.filter(c => c.skillTier === skillTier);
  }

  if (status && status !== 'All') {
    results = results.filter(c => c.status === status);
  }

  res.json({
    total: results.length,
    craftsmen: results
  });
});

// GET single craftsman
router.get('/:id', async (req, res) => {
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      const dbCraftsman = await Craftsman.findOne({ id: req.params.id }).lean();
      if (dbCraftsman) return res.json(dbCraftsman);
    } catch (err) {
      // fallback to memory
    }
  }
  const craftsman = craftsmenList.find(c => c.id === req.params.id);
  if (!craftsman) return res.status(404).json({ error: 'Craftsman not found' });
  res.json(craftsman);
});

// POST new craftsman
router.post('/', async (req, res) => {
  try {
    await ensureDbConnected();
    const { name, empNo, skillTier, specialization, nvqLevel, id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let newId = id ? id.trim().toUpperCase() : `C${String(craftsmenList.length + 1).padStart(3, '0')}`;

    // Validate that newId is unique
    const conflict = craftsmenList.find(c => c.id.toUpperCase() === newId);
    if (conflict) {
      return res.status(400).json({ 
        error: `Bench Number / ID "${newId}" is already assigned to ${conflict.name}. Please select an unused bench number.` 
      });
    }

    const minuteRate = skillTier === 'Grade A' ? 11.50 : skillTier === 'Grade B' ? 9.50 : 7.50;

    const newCraftsman = {
      id: newId,
      originalNo: craftsmenList.length + 1,
      name,
      empNo: empNo || `EMP-${newId}`,
      dept: "Workshop",
      skillTier: skillTier || "Grade B",
      minuteRate,
      specialization: specialization || "General Goldsmith",
      nvqLevel: nvqLevel || "NVQ Level 3",
      avgEfficiency: 80.0,
      status: "Active"
    };

    craftsmenList.push(newCraftsman);
    saveCraftsmenToDisk(); // Permanent save to disk

    try {
      const initialData = require('../data/initialData');
      if (initialData && Array.isArray(initialData.craftsmenList)) {
        initialData.craftsmenList.push(newCraftsman);
      }
    } catch (e) {}

    if (mongoose.connection.readyState === 1) {
      try {
        await Craftsman.create(newCraftsman);
      } catch (err) {
        console.log('MongoDB craftsman insert error:', err.message);
      }
    }

    res.status(201).json(newCraftsman);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create craftsman: ' + err.message });
  }
});

// PUT update craftsman (Name, empNo, skillTier, specialization, status, id / bench number)
router.put('/:id', async (req, res) => {
  try {
    await ensureDbConnected();
    const oldId = req.params.id;
    const index = craftsmenList.findIndex(c => c.id.toUpperCase() === oldId.toUpperCase());
    if (index === -1) return res.status(404).json({ error: 'Craftsman not found' });

    const newId = req.body.id ? req.body.id.trim().toUpperCase() : oldId;

    // Check if new bench ID already belongs to another craftsman
    if (newId !== oldId.toUpperCase()) {
      const conflict = craftsmenList.find(c => c.id.toUpperCase() === newId && c.id.toUpperCase() !== oldId.toUpperCase());
      if (conflict) {
        return res.status(400).json({ 
          error: `Bench Number / ID "${newId}" is already assigned to ${conflict.name}. Please select an unused bench number.` 
        });
      }
    }

    const updated = { ...craftsmenList[index], ...req.body, id: newId };
    if (req.body.skillTier) {
      updated.minuteRate = req.body.skillTier === 'Grade A' ? 11.50 : req.body.skillTier === 'Grade B' ? 9.50 : 7.50;
    }
    craftsmenList[index] = updated;
    saveCraftsmenToDisk(); // Permanent save to disk file!

    // Keep initialData.craftsmenList synchronized
    try {
      const initialData = require('../data/initialData');
      if (initialData && Array.isArray(initialData.craftsmenList)) {
        const initIdx = initialData.craftsmenList.findIndex(c => c.id.toUpperCase() === oldId.toUpperCase());
        if (initIdx !== -1) initialData.craftsmenList[initIdx] = updated;
      }
    } catch (e) {}

    if (mongoose.connection.readyState === 1) {
      try {
        if (newId !== oldId) {
          // If ID changed, update the MongoDB document
          await Craftsman.findOneAndUpdate({ id: oldId }, { $set: updated }, { upsert: true, new: true });
        } else {
          await Craftsman.findOneAndUpdate({ id: oldId }, { $set: updated }, { upsert: true, new: true });
        }
        
        // Cascade updated ID, name and details across existing Allocations, Leaves, and TimeLogs in DB
        const Allocation = require('../models/Allocation');
        const Leave = require('../models/Leave');
        const TimeLog = require('../models/TimeLog');

        const cascadeSet = {};
        if (req.body.name) cascadeSet.craftsmanName = req.body.name;
        if (newId !== oldId) cascadeSet.craftsmanId = newId;

        if (Object.keys(cascadeSet).length > 0) {
          await Allocation.updateMany({ craftsmanId: oldId }, { $set: cascadeSet });
          await Leave.updateMany({ craftsmanId: oldId }, { $set: cascadeSet });
          await TimeLog.updateMany({ craftsmanId: oldId }, { $set: cascadeSet });
        }
      } catch (err) {
        console.log('MongoDB craftsman update error:', err.message);
      }
    }

    // Cascade in-memory allocationsStore as well
    try {
      const { getAllocations, saveAllocationsToDisk } = require('../data/allocationsStore');
      const allMemAllocs = getAllocations();
      if (Array.isArray(allMemAllocs)) {
        let changed = false;
        allMemAllocs.forEach(a => {
          if (a.craftsmanId === oldId) {
            changed = true;
            if (newId !== oldId) a.craftsmanId = newId;
            if (req.body.name) a.craftsmanName = req.body.name;
            if (req.body.skillTier) a.skillTier = req.body.skillTier;
          }
        });
        if (changed) saveAllocationsToDisk();
      }
    } catch (e) {}

    // Cascade in-memory leavesList, allocationsList, and timeLogsList in initialData as well
    try {
      const initialData = require('../data/initialData');
      if (initialData) {
        if (Array.isArray(initialData.leavesList)) {
          initialData.leavesList.forEach(l => {
            if (l.craftsmanId === oldId) {
              if (newId !== oldId) l.craftsmanId = newId;
              if (req.body.name) l.craftsmanName = req.body.name;
            }
          });
        }
        if (Array.isArray(initialData.allocationsList)) {
          initialData.allocationsList.forEach(a => {
            if (a.craftsmanId === oldId) {
              if (newId !== oldId) a.craftsmanId = newId;
              if (req.body.name) a.craftsmanName = req.body.name;
            }
          });
        }
        if (Array.isArray(initialData.timeLogsList)) {
          initialData.timeLogsList.forEach(t => {
            if (t.craftsmanId === oldId) {
              if (newId !== oldId) t.craftsmanId = newId;
              if (req.body.name) t.craftsmanName = req.body.name;
            }
          });
        }
      }
    } catch (e) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update craftsman: ' + err.message });
  }
});

// DELETE craftsman
router.delete('/:id', async (req, res) => {
  try {
    await ensureDbConnected();
    const index = craftsmenList.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Craftsman not found' });

    const removed = craftsmenList.splice(index, 1);
    saveCraftsmenToDisk(); // Permanent save to disk file!

    if (mongoose.connection.readyState === 1) {
      try {
        await Craftsman.deleteOne({ id: req.params.id });
      } catch (err) {
        console.log('MongoDB craftsman delete error:', err.message);
      }
    }

    res.json({ success: true, message: 'Craftsman removed successfully', removed: removed[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete craftsman: ' + err.message });
  }
});

module.exports = router;
