const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureDbConnected } = require('../db');
const Leave = require('../models/Leave');
let { leavesList, craftsmenList } = require('../data/initialData');

// Helper to fetch and merge leaves from MongoDB Atlas and in-memory list
async function getUnifiedLeaves() {
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      const dbLeaves = await Leave.find().sort({ date: -1, createdAt: -1 }).lean();
      if (dbLeaves && dbLeaves.length > 0) {
        const map = new Map();
        leavesList.forEach(l => {
          const key = `${(l.craftsmanId || '').toLowerCase()}_${l.date}`;
          map.set(key, l);
        });
        dbLeaves.forEach(l => {
          const key = `${(l.craftsmanId || '').toLowerCase()}_${l.date}`;
          map.set(key, l);
        });
        return Array.from(map.values());
      }
    } catch (e) {
      console.log('MongoDB getUnifiedLeaves error:', e.message);
    }
  }
  const map = new Map();
  leavesList.forEach(l => {
    const key = `${(l.craftsmanId || '').toLowerCase()}_${l.date}`;
    map.set(key, l);
  });
  return Array.from(map.values());
}

// GET all leaves with filters
router.get('/', async (req, res) => {
  try {
    const { date, month, craftsmanId } = req.query;
    const allLeaves = await getUnifiedLeaves();
    let results = [...allLeaves];

    if (date) {
      results = results.filter(l => l.date === date);
    } else if (month) {
      results = results.filter(l => l.date && l.date.startsWith(month));
    }

    if (craftsmanId) {
      results = results.filter(l => 
        l.craftsmanId && l.craftsmanId.toLowerCase() === craftsmanId.toLowerCase()
      );
    }

    res.json({
      total: results.length,
      leaves: results
    });
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ error: 'Failed to retrieve leaves: ' + err.message });
  }
});

// GET summary of today and current month leaves
router.get('/summary', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7); // e.g. "2026-11"

    const allLeaves = await getUnifiedLeaves();

    const todayLeaves = allLeaves.filter(l => l.date === today);
    const todayHoursLost = todayLeaves.reduce((sum, l) => sum + (l.hoursDeducted || 13.0), 0);

    const monthLeaves = allLeaves.filter(l => l.date && l.date.startsWith(currentMonth));
    const monthHoursLost = monthLeaves.reduce((sum, l) => sum + (l.hoursDeducted || 13.0), 0);

    const totalCraftsmen = craftsmenList.length; // 63
    const activeToday = Math.max(0, totalCraftsmen - todayLeaves.length);
    const availableHoursToday = parseFloat((totalCraftsmen * 13.0 - todayHoursLost).toFixed(1));

    res.json({
      today,
      totalCraftsmen,
      todayAbsentCount: todayLeaves.length,
      activeToday,
      todayHoursLost,
      availableHoursToday,
      monthLeavesCount: monthLeaves.length,
      monthHoursLost,
      recentLeaves: allLeaves.slice(0, 10)
    });
  } catch (err) {
    console.error('Error fetching leave summary:', err);
    res.status(500).json({ error: 'Failed to compute leave summary: ' + err.message });
  }
});

// POST new leave
router.post('/', async (req, res) => {
  try {
    await ensureDbConnected();
    const { craftsmanId, date, leaveType, reason } = req.body;
    if (!craftsmanId) {
      return res.status(400).json({ error: 'Craftsman ID is required' });
    }

    const craftsman = craftsmenList.find(c => c.id.toLowerCase() === craftsmanId.toLowerCase()) ||
                      craftsmenList.find(c => c.name.toLowerCase() === craftsmanId.toLowerCase());
    if (!craftsman) {
      return res.status(404).json({ error: 'Craftsman not found' });
    }

    const selectedType = leaveType || 'Full Day Leave (13h)';
    const hoursDeducted = selectedType.includes('Half Day') ? 6.5 : 13.0;
    const leaveDate = date || new Date().toISOString().split('T')[0];

    // Duplication Guard: One craftsman cannot take multiple leaves on the same day
    const allExisting = await getUnifiedLeaves();
    const existingLeave = allExisting.find(l => 
      l.date === leaveDate && 
      ((l.craftsmanId && l.craftsmanId.toLowerCase() === craftsman.id.toLowerCase()) ||
       (l.craftsmanName && l.craftsmanName.toLowerCase() === craftsman.name.toLowerCase()))
    );

    if (existingLeave) {
      return res.status(400).json({ 
        error: `Craftsman ${craftsman.name} (${craftsman.id}) already has an approved leave recorded for ${leaveDate} [${existingLeave.id}: ${existingLeave.leaveType}]. A craftsman cannot have multiple leaves on the same day.` 
      });
    }

    // Determine unique next ID
    let maxNum = 17;
    leavesList.forEach(l => {
      const m = l.id && String(l.id).match(/^LV-(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    if (mongoose.connection.readyState === 1) {
      try {
        const dbLeaves = await Leave.find().select('id').lean();
        dbLeaves.forEach(l => {
          const m = l.id && String(l.id).match(/^LV-(\d+)$/i);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
      } catch (e) {}
    }

    const newLeave = {
      id: `LV-${String(maxNum + 1).padStart(3, '0')}`,
      date: leaveDate,
      craftsmanId: craftsman.id,
      craftsmanName: craftsman.name,
      empNo: craftsman.empNo || '',
      leaveType: selectedType,
      hoursDeducted,
      reason: reason || 'Approved personal leave',
      status: 'Approved'
    };

    // Upsert into MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await Leave.findOneAndUpdate(
          { id: newLeave.id },
          { $set: newLeave },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.log('MongoDB leave save error:', err.message);
      }
    }

    leavesList.unshift(newLeave);

    res.status(201).json(newLeave);
  } catch (err) {
    console.error('Error adding leave:', err);
    res.status(500).json({ error: 'Failed to record leave: ' + err.message });
  }
});

// DELETE leave
router.delete('/:id', async (req, res) => {
  try {
    await ensureDbConnected();
    const searchId = req.params.id;
    let deletedRecord = null;

    if (mongoose.connection.readyState === 1) {
      try {
        deletedRecord = await Leave.findOneAndDelete({ id: searchId });
      } catch (err) {
        console.log('MongoDB leave delete error:', err.message);
      }
    }

    const index = leavesList.findIndex(l => l.id === searchId);
    if (index !== -1) {
      deletedRecord = leavesList.splice(index, 1)[0];
    }

    if (!deletedRecord) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    res.json({ success: true, message: 'Leave removed successfully', leave: deletedRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave: ' + err.message });
  }
});

module.exports = router;
