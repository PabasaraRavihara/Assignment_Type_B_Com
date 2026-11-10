const express = require('express');
const router = express.Router();
let { leavesList, craftsmenList } = require('../data/initialData');
const Leave = require('../models/Leave');

// GET all leaves with filters
router.get('/', (req, res) => {
  const { date, month, craftsmanId } = req.query;
  let results = [...leavesList];

  if (date) {
    results = results.filter(l => l.date === date);
  } else if (month) {
    results = results.filter(l => l.date.startsWith(month));
  }

  if (craftsmanId) {
    results = results.filter(l => l.craftsmanId === craftsmanId);
  }

  res.json({
    total: results.length,
    leaves: results
  });
});

// GET summary of today and current month leaves
router.get('/summary', (req, res) => {
  const today = req.query.date || new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // e.g. "2026-11"

  const todayLeaves = leavesList.filter(l => l.date === today);
  const todayHoursLost = todayLeaves.reduce((sum, l) => sum + (l.hoursDeducted || 13.0), 0);

  const monthLeaves = leavesList.filter(l => l.date.startsWith(currentMonth));
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
    recentLeaves: leavesList.slice(0, 10)
  });
});

// POST new leave
router.post('/', async (req, res) => {
  const { craftsmanId, date, leaveType, reason } = req.body;
  if (!craftsmanId) {
    return res.status(400).json({ error: 'Craftsman ID is required' });
  }

  const craftsman = craftsmenList.find(c => c.id === craftsmanId);
  if (!craftsman) {
    return res.status(404).json({ error: 'Craftsman not found' });
  }

  const selectedType = leaveType || 'Full Day Leave (13h)';
  const hoursDeducted = selectedType.includes('Half Day') ? 6.5 : 13.0;
  const leaveDate = date || new Date().toISOString().split('T')[0];

  const newLeave = {
    id: `LV-${String(leavesList.length + 1).padStart(3, '0')}`,
    date: leaveDate,
    craftsmanId: craftsman.id,
    craftsmanName: craftsman.name,
    empNo: craftsman.empNo || '',
    leaveType: selectedType,
    hoursDeducted,
    reason: reason || 'Approved personal leave',
    status: 'Approved'
  };

  leavesList.unshift(newLeave);

  // Sync to Mongo if connected
  try {
    await Leave.create(newLeave);
  } catch (err) {
    // In-memory fallback
  }

  res.status(201).json(newLeave);
});

// DELETE leave
router.delete('/:id', async (req, res) => {
  const index = leavesList.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Leave record not found' });
  }

  leavesList.splice(index, 1);

  try {
    await Leave.deleteOne({ id: req.params.id });
  } catch (err) {
    // In-memory fallback
  }

  res.json({ success: true, message: 'Leave removed successfully' });
});

module.exports = router;
