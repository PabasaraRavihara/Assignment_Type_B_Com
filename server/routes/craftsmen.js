const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Craftsman = require('../models/Craftsman');
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

  // If MongoDB is connected and has records, sync to memory
  if (mongoose.connection.readyState === 1) {
    try {
      const dbCraftsmen = await Craftsman.find().lean();
      if (dbCraftsmen && dbCraftsmen.length > 0) {
        craftsmenList.length = 0;
        dbCraftsmen.forEach(c => craftsmenList.push(c));
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
  const { name, empNo, skillTier, specialization, nvqLevel } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const newId = `C${String(craftsmenList.length + 1).padStart(3, '0')}`;
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
    nvqLevel: nvqLevel || "NVQ L3",
    avgEfficiency: 80.0,
    status: "Active"
  };

  craftsmenList.push(newCraftsman);
  saveCraftsmenToDisk(); // Permanent save to disk

  if (mongoose.connection.readyState === 1) {
    try {
      await Craftsman.create(newCraftsman);
    } catch (err) {
      console.log('MongoDB craftsman insert error:', err.message);
    }
  }

  res.status(201).json(newCraftsman);
});

// PUT update craftsman (Name, empNo, skillTier, specialization, status)
router.put('/:id', async (req, res) => {
  const index = craftsmenList.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Craftsman not found' });

  const updated = { ...craftsmenList[index], ...req.body };
  if (req.body.skillTier) {
    updated.minuteRate = req.body.skillTier === 'Grade A' ? 11.50 : req.body.skillTier === 'Grade B' ? 9.50 : 7.50;
  }
  craftsmenList[index] = updated;
  saveCraftsmenToDisk(); // Permanent save to disk file!

  if (mongoose.connection.readyState === 1) {
    try {
      await Craftsman.findOneAndUpdate({ id: req.params.id }, updated, { upsert: true, new: true });
    } catch (err) {
      console.log('MongoDB craftsman update error:', err.message);
    }
  }

  res.json(updated);
});

// DELETE craftsman
router.delete('/:id', async (req, res) => {
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
});

module.exports = router;
