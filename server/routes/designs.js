const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Design = require('../models/Design');
const { ensureDbConnected } = require('../db');
let { designsMaster } = require('../data/initialData');

// GET all designs
router.get('/', async (req, res) => {
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      const dbDesigns = await Design.find().lean();
      if (dbDesigns && dbDesigns.length > 0) {
        const map = new Map();
        designsMaster.forEach(d => map.set(d.code.toUpperCase(), d));
        dbDesigns.forEach(d => map.set(d.code.toUpperCase(), d));
        designsMaster = Array.from(map.values());
      }
    } catch (e) {
      console.log('MongoDB designs fetch notice:', e.message);
    }
  }

  const { category } = req.query;
  let results = [...designsMaster];
  if (category && category !== 'All') {
    results = results.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  res.json({
    total: results.length,
    designs: results
  });
});

// GET single design
router.get('/:code', (req, res) => {
  const design = designsMaster.find(d => d.code === req.params.code);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json(design);
});

// POST new design with operations
router.post('/', async (req, res) => {
  const { code, name, category, goldKarat, metalType, operations, skillTier, allowableGoldLossPct, allowableLossPct, description, totalSMT: rawSMT, craftingMethod, imageUrl, image } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Design code and name required' });

  const existingIdx = designsMaster.findIndex(d => d.code.toUpperCase() === code.toUpperCase());

  // Calculate total SMT from operations, or use directly provided totalSMT
  let calcSMT = 0;
  let processedOps = [];

  if (Array.isArray(operations) && operations.length > 0) {
    processedOps = operations.map((op, idx) => {
      const st = parseFloat(((op.ot || 10) * ((op.rating || 100) / 100) * (1 + (op.allowance || 0.18))).toFixed(2));
      calcSMT += st;
      return {
        seq: (idx + 1) * 10,
        opId: op.opId || `OP-0${idx + 1}`,
        opName: op.opName || 'Crafting Operation',
        ot: parseFloat(op.ot || 10),
        rating: parseInt(op.rating || 100, 10),
        allowance: parseFloat(op.allowance || 0.18),
        st
      };
    });
    calcSMT = parseFloat(calcSMT.toFixed(1));
  } else {
    // Generate standard 5-step master goldsmith routing
    calcSMT = parseFloat(parseFloat(rawSMT || 60.0).toFixed(1));
    const step1 = parseFloat((calcSMT * 0.15).toFixed(1));
    const step2 = parseFloat((calcSMT * 0.25).toFixed(1));
    const step3 = parseFloat((calcSMT * 0.20).toFixed(1));
    const step4 = parseFloat((calcSMT * 0.25).toFixed(1));
    const step5 = parseFloat(Math.max(1, calcSMT - step1 - step2 - step3 - step4).toFixed(1));

    processedOps = [
      { seq: 10, opId: "OP-01", opName: "Melting & Ingot/Wire Rolling", ot: parseFloat((step1 / 1.18).toFixed(1)), rating: 100, allowance: 0.18, st: step1 },
      { seq: 20, opId: "OP-04", opName: "Mandrel Shaping & Blank Piercing", ot: parseFloat((step2 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step2 },
      { seq: 30, opId: "OP-05", opName: "Micro-Torch Precision Soldering", ot: parseFloat((step3 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step3 },
      { seq: 40, opId: "OP-07", opName: "Bench Filing & Emery Finishing", ot: parseFloat((step4 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step4 },
      { seq: 50, opId: "OP-11", opName: "High-Lustre Rouge Mop Polishing & QA", ot: parseFloat((step5 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step5 }
    ];
  }

  const selectedTier = skillTier || "Grade B";
  const rate = selectedTier === 'Grade A' ? 11.50 : selectedTier === 'Grade B' ? 9.50 : 7.50;
  const labourCost = parseFloat((calcSMT * rate).toFixed(2));
  const selectedMetal = metalType || goldKarat || "Gold 22K";
  const defaultLoss = selectedMetal.includes('Platinum') ? 2.0 : selectedMetal.includes('Silver') ? 5.0 : 3.0;
  const rawLoss = allowableLossPct !== undefined ? allowableLossPct : allowableGoldLossPct;
  const lossPct = (rawLoss !== undefined && rawLoss !== null && rawLoss !== '') ? parseFloat(rawLoss) : defaultLoss;

  const newDesign = {
    code: code.trim().toUpperCase(),
    name: name.trim(),
    category: category || "Ring",
    metalType: selectedMetal,
    goldKarat: selectedMetal,
    craftingMethod: craftingMethod || "HANDMADE",
    totalSMT: calcSMT,
    skillTier: selectedTier,
    minuteRate: rate,
    labourCost,
    allowableGoldLossPct: lossPct,
    allowableLossPct: lossPct,
    imageUrl: imageUrl || image || '',
    description: description || `Master workshop design for ${name.trim()}`,
    operations: processedOps
  };

  if (existingIdx >= 0) {
    designsMaster[existingIdx] = newDesign;
  } else {
    designsMaster.push(newDesign);
  }

  // Persist to MongoDB if connected
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      await Design.findOneAndUpdate({ code: newDesign.code }, newDesign, { upsert: true, new: true });
    } catch (e) {
      console.log('MongoDB design create notice:', e.message);
    }
  }

  res.status(201).json(newDesign);
});

// PUT update existing design
router.put('/:code', async (req, res) => {
  const targetCode = req.params.code.trim().toUpperCase();
  const existingIdx = designsMaster.findIndex(d => d.code.toUpperCase() === targetCode);
  if (existingIdx === -1) {
    return res.status(404).json({ error: 'Design not found' });
  }

  const existing = designsMaster[existingIdx];
  const { name, category, goldKarat, metalType, operations, skillTier, allowableGoldLossPct, allowableLossPct, description, totalSMT: rawSMT, craftingMethod, imageUrl, image } = req.body;

  let calcSMT = rawSMT !== undefined ? parseFloat(parseFloat(rawSMT).toFixed(1)) : existing.totalSMT;
  let processedOps = existing.operations || [];

  if (Array.isArray(operations) && operations.length > 0) {
    calcSMT = 0;
    processedOps = operations.map((op, idx) => {
      const st = parseFloat(((op.ot || 10) * ((op.rating || 100) / 100) * (1 + (op.allowance || 0.18))).toFixed(2));
      calcSMT += st;
      return {
        seq: (idx + 1) * 10,
        opId: op.opId || `OP-0${idx + 1}`,
        opName: op.opName || 'Crafting Operation',
        ot: parseFloat(op.ot || 10),
        rating: parseInt(op.rating || 100, 10),
        allowance: parseFloat(op.allowance || 0.18),
        st
      };
    });
    calcSMT = parseFloat(calcSMT.toFixed(1));
  } else if (rawSMT !== undefined && parseFloat(rawSMT) !== parseFloat(existing.totalSMT)) {
    // SMT changed directly: generate proportional steps
    calcSMT = parseFloat(parseFloat(rawSMT).toFixed(1));
    const step1 = parseFloat((calcSMT * 0.15).toFixed(1));
    const step2 = parseFloat((calcSMT * 0.25).toFixed(1));
    const step3 = parseFloat((calcSMT * 0.20).toFixed(1));
    const step4 = parseFloat((calcSMT * 0.25).toFixed(1));
    const step5 = parseFloat(Math.max(1, calcSMT - step1 - step2 - step3 - step4).toFixed(1));

    processedOps = [
      { seq: 10, opId: "OP-01", opName: "Melting & Ingot/Wire Rolling", ot: parseFloat((step1 / 1.18).toFixed(1)), rating: 100, allowance: 0.18, st: step1 },
      { seq: 20, opId: "OP-04", opName: "Mandrel Shaping & Blank Piercing", ot: parseFloat((step2 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step2 },
      { seq: 30, opId: "OP-05", opName: "Micro-Torch Precision Soldering", ot: parseFloat((step3 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step3 },
      { seq: 40, opId: "OP-07", opName: "Bench Filing & Emery Finishing", ot: parseFloat((step4 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step4 },
      { seq: 50, opId: "OP-11", opName: "High-Lustre Rouge Mop Polishing & QA", ot: parseFloat((step5 / 1.19).toFixed(1)), rating: 100, allowance: 0.19, st: step5 }
    ];
  }

  const selectedTier = skillTier || existing.skillTier || "Grade B";
  const rate = selectedTier === 'Grade A' ? 11.50 : selectedTier === 'Grade B' ? 9.50 : 7.50;
  const labourCost = parseFloat((calcSMT * rate).toFixed(2));
  const selectedMetal = metalType || goldKarat || existing.metalType || "Gold 22K";
  const defaultLoss = selectedMetal.includes('Platinum') ? 2.0 : selectedMetal.includes('Silver') ? 5.0 : 3.0;
  const rawLoss = allowableLossPct !== undefined ? allowableLossPct : allowableGoldLossPct;
  const lossPct = (rawLoss !== undefined && rawLoss !== null && rawLoss !== '') ? parseFloat(rawLoss) : parseFloat(existing.allowableLossPct ?? existing.allowableGoldLossPct ?? defaultLoss);

  const updatedDesign = {
    ...existing,
    code: targetCode,
    name: name !== undefined ? name.trim() : existing.name,
    category: category || existing.category || "Ring",
    metalType: selectedMetal,
    goldKarat: selectedMetal,
    craftingMethod: craftingMethod || existing.craftingMethod || "HANDMADE",
    totalSMT: calcSMT,
    skillTier: selectedTier,
    minuteRate: rate,
    labourCost,
    allowableGoldLossPct: lossPct,
    allowableLossPct: lossPct,
    imageUrl: imageUrl !== undefined ? imageUrl : (image !== undefined ? image : (existing.imageUrl || '')),
    description: description !== undefined ? description : existing.description,
    operations: processedOps
  };

  designsMaster[existingIdx] = updatedDesign;

  // Persist to MongoDB if connected
  await ensureDbConnected();
  if (mongoose.connection.readyState === 1) {
    try {
      await Design.findOneAndUpdate({ code: targetCode }, updatedDesign, { upsert: true, new: true });
    } catch (e) {
      console.log('MongoDB design update notice:', e.message);
    }
  }

  res.json(updatedDesign);
});

module.exports = router;
