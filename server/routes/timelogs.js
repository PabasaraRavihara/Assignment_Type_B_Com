const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TimeLog = require('../models/TimeLog');
const { ensureDbConnected } = require('../db');
let { timeLogsList, craftsmenList, designsMaster } = require('../data/initialData');

// GET all time logs
router.get('/', async (req, res) => {
  const { date, craftsmanId } = req.query;

  try {
    await ensureDbConnected();
    if (mongoose.connection.readyState === 1) {
      const dbLogs = await TimeLog.find().sort({ date: -1, createdAt: -1 }).lean();
      if (dbLogs && dbLogs.length > 0) {
        const logMap = new Map();
        // Insert dbLogs first so MongoDB records take priority
        dbLogs.forEach(t => logMap.set(t.id, t));
        // Add memory logs if not in DB
        timeLogsList.forEach(t => {
          if (!logMap.has(t.id)) logMap.set(t.id, t);
        });
        timeLogsList = Array.from(logMap.values());
      }
    }
  } catch (e) {
    console.log('MongoDB timelogs fetch notice:', e.message);
  }

  // Sort newest date first, and newest ID first
  let results = [...timeLogsList].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return db.localeCompare(da);
    return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
  });

  if (date) results = results.filter(t => t.date === date);
  if (craftsmanId) results = results.filter(t => t.craftsmanId === craftsmanId);

  res.json({
    total: results.length,
    timeLogs: results
  });
});

// POST new time log & piecework payout calculation
router.post('/', async (req, res) => {
  await ensureDbConnected();
  const {
    allocId,
    craftsmanId,
    clockIn,
    clockOut,
    breakMin,
    designCode,
    completedQty,
    passedQA,
    reworkQty,
    goldIssuedGrams,
    goldReturnedGrams,
    date
  } = req.body;

  if (!craftsmanId || !designCode || !clockIn || !clockOut) {
    return res.status(400).json({ error: 'Craftsman, Design, Clock In and Clock Out are required' });
  }

  const craftsman = craftsmenList.find(c => c.id === craftsmanId);
  const design = designsMaster.find(d => d.code === designCode);
  if (!craftsman || !design) return res.status(404).json({ error: 'Craftsman or Design not found' });

  // 1. Calculate Actual Working Minutes (AWM)
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const grossMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  const breakMinutes = parseInt(breakMin || 60, 10);
  const awm = Math.max(grossMinutes - breakMinutes, 1);

  // 2. Calculate Earned Standard Minutes (ESM)
  const passed = parseInt(passedQA || 0, 10);
  const completed = parseInt(completedQty || passed, 10);
  const rework = parseInt(reworkQty || 0, 10);
  const esm = parseFloat((passed * design.totalSMT).toFixed(1));

  // 3. Efficiency %
  const efficiency = parseFloat(((esm / awm) * 100).toFixed(1));

  // 4. Piece-Rate Base Output Pay
  const minuteRate = craftsman.minuteRate;
  const basePay = parseFloat((esm * minuteRate).toFixed(2));

  // 5. High-Efficiency & Zero Defect Bonus (Rs. 450 standard or manual custom bonus)
  const autoBonus = (efficiency >= 85.0 && rework === 0) ? 450.0 : 0.0;
  const bonus = (req.body.bonus !== undefined && req.body.bonus !== null && req.body.bonus !== '')
    ? parseFloat(req.body.bonus)
    : autoBonus;
  const totalPay = parseFloat((basePay + bonus).toFixed(2));

  // 6. Gold Loss %
  let goldLossPct = 0;
  if (goldIssuedGrams && goldReturnedGrams) {
    const issued = parseFloat(goldIssuedGrams);
    const returned = parseFloat(goldReturnedGrams);
    if (issued > 0) {
      goldLossPct = parseFloat((((issued - returned) / issued) * 100).toFixed(2));
    }
  } else {
    goldLossPct = design.allowableGoldLossPct || 3.0;
  }

  const newLog = {
    id: `TL-${String(timeLogsList.length + 1).padStart(3, '0')}`,
    date: date || new Date().toISOString().split('T')[0],
    allocId: allocId || `AL-${Date.now().toString().slice(-4)}`,
    craftsmanId: craftsman.id,
    craftsmanName: craftsman.name,
    clockIn,
    clockOut,
    breakMin: breakMinutes,
    awm,
    designCode: design.code,
    completedQty: completed,
    passedQA: passed,
    reworkQty: rework,
    esm,
    efficiency,
    minuteRate,
    basePay,
    bonus,
    totalPay,
    goldLossPct
  };

  timeLogsList.unshift(newLog);

  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    try {
      const TimeLog = require('../models/TimeLog');
      TimeLog.create(newLog).catch(e => console.log('MongoDB TimeLog insert notice:', e.message));
    } catch (e) {}
  }

  res.status(201).json(newLog);
});

// PUT update bonus and recalculate total pay for a time log
router.put('/:id', async (req, res) => {
  await ensureDbConnected();
  const { id } = req.params;
  const { bonus } = req.body;

  const logIndex = timeLogsList.findIndex(t => t.id === id);
  if (logIndex === -1) {
    return res.status(404).json({ error: 'Time log not found' });
  }

  const existing = timeLogsList[logIndex];
  const newBonus = parseFloat(bonus !== undefined && bonus !== null ? bonus : existing.bonus);
  existing.bonus = newBonus;
  existing.totalPay = parseFloat((existing.basePay + newBonus).toFixed(2));

  // Sync to MongoDB if connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    try {
      const TimeLog = require('../models/TimeLog');
      await TimeLog.findOneAndUpdate(
        { id },
        { bonus: newBonus, totalPay: existing.totalPay },
        { new: true }
      );
    } catch (e) {
      console.log('MongoDB TimeLog update notice:', e.message);
    }
  }

  res.json(existing);
});

module.exports = router;
