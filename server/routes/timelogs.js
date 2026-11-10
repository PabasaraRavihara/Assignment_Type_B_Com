const express = require('express');
const router = express.Router();
let { timeLogsList, craftsmenList, designsMaster } = require('../data/initialData');

// GET all time logs
router.get('/', (req, res) => {
  const { date, craftsmanId } = req.query;
  let results = [...timeLogsList];
  if (date) results = results.filter(t => t.date === date);
  if (craftsmanId) results = results.filter(t => t.craftsmanId === craftsmanId);

  res.json({
    total: results.length,
    timeLogs: results
  });
});

// POST new time log & piecework payout calculation
router.post('/', (req, res) => {
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

  // 5. High-Efficiency & Zero Defect Bonus (Rs. 450)
  const bonus = (efficiency >= 85.0 && rework === 0) ? 450.0 : 0.0;
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
  res.status(201).json(newLog);
});

module.exports = router;
