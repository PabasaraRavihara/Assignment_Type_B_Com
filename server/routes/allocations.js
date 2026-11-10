const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const { getAllocations, setAllocations, saveAllocationsToDisk } = require('../data/allocationsStore');
let { craftsmenList, designsMaster, leavesList } = require('../data/initialData');

// Helper to sync from MongoDB Atlas if available
const syncFromAtlasIfConnected = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const dbAllocs = await Allocation.find().sort({ createdAt: -1 }).lean();
      if (dbAllocs && dbAllocs.length > 0) {
        setAllocations(dbAllocs);
      }
    } catch (err) {
      console.log('MongoDB allocations fetch notice:', err.message);
    }
  }
};

// GET all allocations with optional channel filtering
router.get('/', async (req, res) => {
  await syncFromAtlasIfConnected();

  const { date, status, craftsmanId, channel, month } = req.query;
  let results = [...getAllocations()];

  if (date) results = results.filter(a => a.date === date);
  if (month) results = results.filter(a => a.date && a.date.startsWith(month));
  if (status) results = results.filter(a => a.status === status);
  if (craftsmanId) results = results.filter(a => a.craftsmanId === craftsmanId);
  if (channel && channel !== 'ALL') results = results.filter(a => a.channel === channel);

  res.json({
    total: results.length,
    allocations: results
  });
});

// POST new allocation
router.post('/', async (req, res) => {
  const { 
    craftsmanId, 
    designCode, 
    qtyAllocated, 
    channel, 
    channelName, 
    workOrder, 
    date,
    metalType,
    assumedHours,
    actualHours,
    goldIssuedGrams,
    goldReturnedGrams 
  } = req.body;

  if (!craftsmanId || !designCode || !qtyAllocated) {
    return res.status(400).json({ error: 'Craftsman, Design Code, and Quantity are required' });
  }

  const craftsman = craftsmenList.find(c => c.id === craftsmanId);
  if (!craftsman) return res.status(404).json({ error: 'Craftsman not found' });

  const design = designsMaster.find(d => d.code === designCode) || designsMaster[0];
  const qty = parseInt(qtyAllocated, 10);
  const budgetedSMT = parseFloat((design.totalSMT * qty).toFixed(1));

  const calcAssumedHours = assumedHours ? parseFloat(parseFloat(assumedHours).toFixed(2)) : parseFloat((budgetedSMT / 60).toFixed(2));

  let budgetWarning = null;
  if (budgetedSMT > 520) {
    budgetWarning = `Allocation (${budgetedSMT} min / ${calcAssumedHours} hrs) exceeds recommended daily ceiling of 520 min.`;
  } else if (budgetedSMT < 400) {
    budgetWarning = `Allocation (${budgetedSMT} min / ${calcAssumedHours} hrs) is below standard daily capacity (450 min).`;
  }

  const selectedChannel = channel || "OWN_SHOWROOM";
  const defaultNames = {
    EXTERNAL_SHOP: "External Retail Jeweller Order",
    OWN_SHOWROOM: "Ashadi Branch Showroom",
    FACTORY_STOCK: "Central Factory Buffer Stock",
    OWNER_SPECIAL: "Owner / VIP Custom Order"
  };

  const selectedMetal = metalType || design.metalType || "Gold 22K";

  const calcActualHours = actualHours !== undefined && actualHours !== null && actualHours !== '' 
    ? parseFloat(parseFloat(actualHours).toFixed(2)) 
    : null;

  const varianceHours = calcActualHours !== null 
    ? parseFloat((calcActualHours - calcAssumedHours).toFixed(2)) 
    : null;

  const variancePct = calcActualHours !== null && calcAssumedHours > 0 
    ? parseFloat(((varianceHours / calcAssumedHours) * 100).toFixed(1)) 
    : null;

  let goldLossPct = null;
  if (goldIssuedGrams && goldReturnedGrams) {
    const issued = parseFloat(goldIssuedGrams);
    const ret = parseFloat(goldReturnedGrams);
    if (issued > 0) {
      goldLossPct = parseFloat((((issued - ret) / issued) * 100).toFixed(2));
    }
  }

  const allocationsList = getAllocations();
  const newAllocation = {
    id: `AL-${1000 + allocationsList.length + 1}`,
    date: date || new Date().toISOString().split('T')[0],
    channel: selectedChannel,
    channelName: channelName || defaultNames[selectedChannel],
    craftsmanId: craftsman.id,
    craftsmanName: craftsman.name,
    skillTier: craftsman.skillTier,
    workOrder: workOrder || `WO-${Date.now().toString().slice(-6)}`,
    metalType: selectedMetal,
    designCode: design.code,
    designName: design.name,
    unitSMT: design.totalSMT,
    qtyAllocated: qty,
    budgetedSMT,
    assumedHours: calcAssumedHours,
    actualHours: calcActualHours,
    varianceHours,
    variancePct,
    status: calcActualHours !== null ? "Completed" : "In Progress",
    budgetWarning,
    goldIssuedGrams: goldIssuedGrams ? parseFloat(goldIssuedGrams) : null,
    goldReturnedGrams: goldReturnedGrams ? parseFloat(goldReturnedGrams) : null,
    goldLossPct,
    dispatchTime: req.body.dispatchTime || null
  };

  allocationsList.unshift(newAllocation);
  saveAllocationsToDisk(); // Permanent save to disk file!

  if (mongoose.connection.readyState === 1) {
    try {
      await Allocation.create(newAllocation);
    } catch (err) {
      console.log('MongoDB allocation create error:', err.message);
    }
  }

  res.status(201).json(newAllocation);
});

// POST Bulk Dispatch (60+ Benches at once from Fast Entry Worksheet)
router.post('/bulk', async (req, res) => {
  try {
    const { allocations, date } = req.body;
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: 'Array of allocations is required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const allocationsList = getAllocations();
    const createdList = [];
    const dispatchedCraftsmanIds = new Set();

    const defaultNames = {
      EXTERNAL_SHOP: "External Retail Jeweller Order",
      OWN_SHOWROOM: "Ashadi Branch Showroom",
      FACTORY_STOCK: "Central Factory Buffer Stock",
      OWNER_SPECIAL: "Owner / VIP Custom Order"
    };

    allocations.forEach((item, index) => {
      const craftsman = craftsmenList.find(c => c.id === item.craftsmanId);
      const design = designsMaster.find(d => d.code === item.designCode) || designsMaster[0];
      if (!craftsman) return;

      dispatchedCraftsmanIds.add(craftsman.id);

      const qty = parseInt(item.qtyAllocated || 1, 10);
      const budgetedSMT = parseFloat((design.totalSMT * qty).toFixed(1));
      const assumed = item.assumedHours ? parseFloat(parseFloat(item.assumedHours).toFixed(2)) : parseFloat((budgetedSMT / 60).toFixed(2));
      const actual = item.actualHours !== undefined && item.actualHours !== null && item.actualHours !== '' 
        ? parseFloat(parseFloat(item.actualHours).toFixed(2)) 
        : null;

      const varianceHours = actual !== null ? parseFloat((actual - assumed).toFixed(2)) : null;
      const variancePct = actual !== null && assumed > 0 ? parseFloat(((varianceHours / assumed) * 100).toFixed(1)) : null;

      let goldLossPct = null;
      if (item.goldIssuedGrams && item.goldReturnedGrams) {
        const issued = parseFloat(item.goldIssuedGrams);
        const ret = parseFloat(item.goldReturnedGrams);
        if (issued > 0) {
          goldLossPct = parseFloat((((issued - ret) / issued) * 100).toFixed(2));
        }
      }

      const newAlloc = {
        id: `AL-${1000 + allocationsList.length + createdList.length + 1}`,
        date: targetDate,
        channel: item.channel || "OWN_SHOWROOM",
        channelName: item.channelName || defaultNames[item.channel || "OWN_SHOWROOM"],
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        skillTier: craftsman.skillTier,
        workOrder: item.workOrder || `WO-${targetDate.replace(/-/g, '').slice(2)}-${craftsman.id}`,
        metalType: item.metalType || design.metalType || "Gold 22K",
        designCode: design.code,
        designName: design.name,
        unitSMT: design.totalSMT,
        qtyAllocated: qty,
        budgetedSMT,
        assumedHours: assumed,
        actualHours: actual,
        varianceHours,
        variancePct,
        status: actual !== null ? "Completed" : "In Progress",
        goldIssuedGrams: item.goldIssuedGrams ? parseFloat(item.goldIssuedGrams) : null,
        goldReturnedGrams: item.goldReturnedGrams ? parseFloat(item.goldReturnedGrams) : null,
        goldLossPct,
        dispatchTime: item.dispatchTime || "07:15 AM"
      };

      createdList.push(newAlloc);
    });

    // Remove any previous allocations for these same craftsmen on this exact date to prevent duplicate double-counting
    const existingCleanList = allocationsList.filter(a => !(a.date === targetDate && dispatchedCraftsmanIds.has(a.craftsmanId)));
    setAllocations([...createdList, ...existingCleanList]);

    if (mongoose.connection.readyState === 1 && createdList.length > 0) {
      try {
        await Allocation.deleteMany({ date: targetDate, craftsmanId: { $in: Array.from(dispatchedCraftsmanIds) } });
        await Allocation.insertMany(createdList);
      } catch (err) {
        console.log('MongoDB bulk insert error:', err.message);
      }
    }

    res.status(201).json({
      message: `Batch dispatched ${createdList.length} benches for ${targetDate}`,
      count: createdList.length,
      allocations: createdList
    });
  } catch (err) {
    console.error('Error in POST /allocations/bulk:', err);
    res.status(500).json({ error: 'Server error saving batch allocations: ' + err.message });
  }
});

// POST Auto-Populate Entire Shift
router.post('/auto-shift-populate', async (req, res) => {
  const { date, markCompleted } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const dateLeaves = leavesList.filter(l => l.date === targetDate);
  const absentCraftsmanIds = new Set(dateLeaves.map(l => l.craftsmanId));

  const clientNames = {
    EXTERNAL_SHOP: ['Swarna Jewellers (Pettah)', 'Rathna Jewellers (Galle)', 'Lalitha Gems & Jewellers', 'Raja Jewellers Contract', 'Vogue Subcontract'],
    OWN_SHOWROOM: ['Ashadi Flagship Showroom (Colombo 04)', 'Ashadi Branch (Kandy City Center)', 'Ashadi Branch (Kurunegala)', 'Ashadi Branch (Negombo)'],
    FACTORY_STOCK: ['Central Factory Finished Goods Stock', 'Central Factory Buffer Stock'],
    OWNER_SPECIAL: ['Chairman / Owner Private VIP Commission', 'Owner VIP Bridal Suite']
  };

  const createdList = [];
  const allocationsList = getAllocations();
  const existingForDate = new Set(allocationsList.filter(a => a.date === targetDate).map(a => a.craftsmanId));

  craftsmenList.forEach((craftsman, idx) => {
    if (absentCraftsmanIds.has(craftsman.id)) return;
    if (existingForDate.has(craftsman.id)) return;

    let selectedChannel = 'OWN_SHOWROOM';
    if (idx % 10 < 4) selectedChannel = 'OWN_SHOWROOM';
    else if (idx % 10 < 7) selectedChannel = 'EXTERNAL_SHOP';
    else if (idx % 10 < 9) selectedChannel = 'FACTORY_STOCK';
    else selectedChannel = 'OWNER_SPECIAL';

    let design = designsMaster[0];
    let qty = 4;
    if (craftsman.skillTier === 'Grade A') {
      const gADesigns = designsMaster.filter(d => d.skillTier === 'Grade A');
      design = gADesigns[idx % gADesigns.length] || designsMaster[1];
      qty = design.category === 'Necklace' ? 2 : design.category === 'Bracelet' ? 3 : 4;
    } else if (craftsman.skillTier === 'Grade B') {
      design = designsMaster[idx % designsMaster.length];
      qty = design.category === 'Ring' ? 6 : 3;
    } else {
      design = designsMaster[0];
      qty = 8;
    }

    const budgetedSMT = parseFloat((design.totalSMT * qty).toFixed(1));
    const assumedHours = parseFloat((budgetedSMT / 60).toFixed(2));
    
    let actualHours = null;
    let varianceHours = null;
    let variancePct = null;
    let goldLossPct = null;
    let goldIssuedGrams = null;
    let goldReturnedGrams = null;

    if (markCompleted) {
      const varianceFactor = 1.0 + ((idx % 7) * 0.035);
      actualHours = parseFloat((assumedHours * varianceFactor).toFixed(2));
      varianceHours = parseFloat((actualHours - assumedHours).toFixed(2));
      variancePct = parseFloat(((varianceHours / assumedHours) * 100).toFixed(1));
      goldIssuedGrams = parseFloat((qty * 8.5).toFixed(2));
      goldLossPct = parseFloat((3.0 + (idx % 5) * 0.15).toFixed(2));
      goldReturnedGrams = parseFloat((goldIssuedGrams * (1 - goldLossPct / 100)).toFixed(2));
    }

    const clientList = clientNames[selectedChannel];
    const clientName = clientList[idx % clientList.length];

    const newAlloc = {
      id: `AL-${1000 + allocationsList.length + createdList.length + 1}`,
      date: targetDate,
      channel: selectedChannel,
      channelName: clientName,
      craftsmanId: craftsman.id,
      craftsmanName: craftsman.name,
      skillTier: craftsman.skillTier,
      workOrder: `WO-${selectedChannel.slice(0, 3)}-${targetDate.replace(/-/g, '').slice(2)}-${String(idx + 1).padStart(2, '0')}`,
      metalType: design.metalType || "Gold 22K",
      designCode: design.code,
      designName: design.name,
      unitSMT: design.totalSMT,
      qtyAllocated: qty,
      budgetedSMT,
      assumedHours,
      actualHours,
      varianceHours,
      variancePct,
      status: actualHours !== null ? "Completed" : "In Progress",
      goldIssuedGrams,
      goldReturnedGrams,
      goldLossPct
    };

    createdList.push(newAlloc);
  });

  const currentList = getAllocations();
  setAllocations([...createdList, ...currentList]);

  if (mongoose.connection.readyState === 1 && createdList.length > 0) {
    try {
      await Allocation.insertMany(createdList);
    } catch (err) {
      console.log('MongoDB auto-shift insert error:', err.message);
    }
  }

  res.status(201).json({
    message: `Auto-dispatched ${createdList.length} active benches for ${targetDate}`,
    count: createdList.length,
    allocations: createdList
  });
});

// PUT update any field of an allocation (Full edit capability)
router.put('/:id', async (req, res) => {
  const allocationsList = getAllocations();
  const index = allocationsList.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Allocation not found' });

  const existing = allocationsList[index];
  const updated = { ...existing, ...req.body };

  // Recalculate craftsman name if craftsmanId changed
  if (req.body.craftsmanId && req.body.craftsmanId !== existing.craftsmanId) {
    const c = craftsmenList.find(craft => craft.id === req.body.craftsmanId);
    if (c) {
      updated.craftsmanName = c.name;
      updated.skillTier = c.skillTier;
    }
  }

  // Recalculate design if designCode changed
  if (req.body.designCode && req.body.designCode !== existing.designCode) {
    const d = designsMaster.find(des => des.code === req.body.designCode);
    if (d) {
      updated.designName = d.name;
      updated.unitSMT = d.totalSMT;
      if (!req.body.metalType) updated.metalType = d.metalType || "Gold 22K";
      const q = updated.qtyAllocated || 1;
      updated.budgetedSMT = parseFloat((d.totalSMT * q).toFixed(1));
    }
  }

  // Recalculate Assumed Hours if qty changed
  if (req.body.qtyAllocated !== undefined && req.body.assumedHours === undefined) {
    const unit = updated.unitSMT || 45.2;
    const q = parseInt(req.body.qtyAllocated, 10) || 1;
    updated.budgetedSMT = parseFloat((unit * q).toFixed(1));
    updated.assumedHours = parseFloat((updated.budgetedSMT / 60).toFixed(2));
  } else if (req.body.assumedHours !== undefined) {
    updated.assumedHours = parseFloat(parseFloat(req.body.assumedHours).toFixed(2));
  }

  // Recalculate Actual Hours and Variances
  if (req.body.actualHours !== undefined && req.body.actualHours !== null && req.body.actualHours !== '') {
    const act = parseFloat(req.body.actualHours);
    updated.actualHours = act;
    const assumed = updated.assumedHours || (updated.budgetedSMT / 60);
    updated.varianceHours = parseFloat((act - assumed).toFixed(2));
    updated.variancePct = assumed > 0 ? parseFloat(((updated.varianceHours / assumed) * 100).toFixed(1)) : 0;
    if (!req.body.status) updated.status = 'Completed';
  } else if (req.body.actualHours === null || req.body.actualHours === '') {
    updated.actualHours = null;
    updated.varianceHours = null;
    updated.variancePct = null;
  }

  // Recalculate Gold Loss %
  const issued = updated.goldIssuedGrams ? parseFloat(updated.goldIssuedGrams) : null;
  const returned = updated.goldReturnedGrams ? parseFloat(updated.goldReturnedGrams) : null;
  if (issued && returned && issued > 0) {
    updated.goldLossPct = parseFloat((((issued - returned) / issued) * 100).toFixed(2));
  }

  allocationsList[index] = updated;
  saveAllocationsToDisk(); // Permanent save to disk file!

  if (mongoose.connection.readyState === 1) {
    try {
      await Allocation.findOneAndUpdate({ id: req.params.id }, updated, { upsert: true, new: true });
    } catch (err) {
      console.log('MongoDB allocation update error:', err.message);
    }
  }

  res.json(updated);
});

// DELETE single allocation
router.delete('/:id', async (req, res) => {
  const allocationsList = getAllocations();
  const index = allocationsList.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Allocation not found' });

  const removed = allocationsList.splice(index, 1);
  saveAllocationsToDisk(); // Permanent save to disk file!

  if (mongoose.connection.readyState === 1) {
    try {
      await Allocation.deleteOne({ id: req.params.id });
    } catch (err) {
      console.log('MongoDB allocation delete error:', err.message);
    }
  }

  res.json({ success: true, message: 'Order allocation removed successfully', removed: removed[0] });
});

// POST Clear All Sample / Past Orders (Allows starting completely fresh with real factory orders)
router.post('/clear-all', async (req, res) => {
  const current = getAllocations();
  const count = current.length;
  setAllocations([]); // Permanent clear to disk file!

  if (mongoose.connection.readyState === 1) {
    try {
      await Allocation.deleteMany({});
    } catch (err) {
      console.log('MongoDB clear all allocations error:', err.message);
    }
  }

  res.json({ 
    success: true, 
    message: `Cleared all ${count} orders. You can now enter only your real factory production records.`,
    deletedCount: count 
  });
});

module.exports = router;
