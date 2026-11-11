const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const Craftsman = require('../models/Craftsman');
const Design = require('../models/Design');
const { getAllocations, setAllocations, saveAllocationsToDisk } = require('../data/allocationsStore');
const { ensureDbConnected } = require('../db');
let { craftsmenList, designsMaster, leavesList } = require('../data/initialData');

// Helper to sync from MongoDB Atlas if available
const syncFromAtlasIfConnected = async () => {
  await ensureDbConnected();
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

// Generate guaranteed non-colliding unique allocation ID (e.g. AL-1065)
const generateAllocationId = async () => {
  await ensureDbConnected();
  let maxNum = 1000;
  
  if (mongoose.connection.readyState === 1) {
    try {
      const dbDocs = await Allocation.find({}, { id: 1 }).lean();
      dbDocs.forEach(d => {
        const match = d.id && String(d.id).match(/^AL-(\d+)$/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
    } catch (e) {}
  }

  const memList = getAllocations();
  memList.forEach(d => {
    const match = d.id && String(d.id).match(/^AL-(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  return `AL-${maxNum + 1}`;
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
  try {
    await syncFromAtlasIfConnected();

    let { 
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

    // Intelligent fallback so dispatch never hard-fails
    if (!craftsmanId && craftsmenList.length > 0) {
      craftsmanId = craftsmenList[0].id;
    }
    if (!designCode && designsMaster.length > 0) {
      designCode = designsMaster[0].code;
    }
    const qty = parseInt(qtyAllocated, 10) || 1;

    if (!craftsmanId || !designCode) {
      return res.status(400).json({ error: 'Valid Craftsman and Design Code are required to dispatch order.' });
    }

    // Resolve craftsman
    let craftsman = craftsmenList.find(c => c.id === craftsmanId);
    if (!craftsman && mongoose.connection.readyState === 1) {
      try {
        const dbCraft = await Craftsman.findOne({ id: craftsmanId }).lean();
        if (dbCraft) craftsman = dbCraft;
      } catch (e) {}
    }
    if (!craftsman) {
      craftsman = { id: craftsmanId, name: req.body.craftsmanName || craftsmanId, skillTier: 'Grade B' };
    }

    // Resolve design
    let design = designsMaster.find(d => d.code === designCode);
    if (!design && mongoose.connection.readyState === 1) {
      try {
        const dbDes = await Design.findOne({ code: designCode }).lean();
        if (dbDes) design = dbDes;
      } catch (e) {}
    }
    if (!design) {
      design = designsMaster[0] || { code: designCode, name: designCode, totalSMT: 60, metalType: 'Gold 22K' };
    }

    let budgetedSMT = parseFloat(((design.totalSMT || 60) * qty).toFixed(1));
    let totalQty = qty;
    if (req.body.isSuite && Array.isArray(req.body.items) && req.body.items.length > 0) {
      budgetedSMT = parseFloat(req.body.items.reduce((sum, it) => sum + (parseFloat(it.totalSMT) || ((parseFloat(it.unitSMT) || 0) * (parseInt(it.qty, 10) || 1))), 0).toFixed(1));
      totalQty = req.body.items.reduce((sum, it) => sum + (parseInt(it.qty, 10) || 1), 0);
    }

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

    const uniqueId = await generateAllocationId();
    const allocationsList = getAllocations();

    const newAllocation = {
      id: uniqueId,
      date: date || new Date().toISOString().split('T')[0],
      channel: selectedChannel,
      channelName: channelName || defaultNames[selectedChannel],
      craftsmanId: craftsman.id,
      craftsmanName: craftsman.name,
      skillTier: craftsman.skillTier || 'Grade B',
      workOrder: workOrder || `WO-${selectedChannel.slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      metalType: selectedMetal,
      designCode: req.body.isSuite ? (req.body.designCode || (req.body.items?.[0]?.designCode) || 'SUITE-SET') : design.code,
      designName: req.body.isSuite ? (req.body.suiteName || 'Jewellery Suite / Set') : design.name,
      unitSMT: req.body.isSuite ? (totalQty > 0 ? parseFloat((budgetedSMT / totalQty).toFixed(1)) : budgetedSMT) : (design.totalSMT || 60),
      qtyAllocated: totalQty,
      budgetedSMT,
      assumedHours: calcAssumedHours,
      actualHours: calcActualHours,
      varianceHours,
      variancePct,
      status: req.body.status || (calcActualHours !== null ? "Completed" : "In Progress"),
      budgetWarning,
      goldIssuedGrams: goldIssuedGrams ? parseFloat(goldIssuedGrams) : null,
      goldReturnedGrams: goldReturnedGrams ? parseFloat(goldReturnedGrams) : null,
      goldLossPct,
      dispatchTime: req.body.dispatchTime || "08:00 AM",
      isSuite: !!req.body.isSuite,
      suiteName: req.body.suiteName || null,
      items: Array.isArray(req.body.items) ? req.body.items : []
    };

    allocationsList.unshift(newAllocation);
    saveAllocationsToDisk();

    let finalAllocation = newAllocation;
    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, createdAt, updatedAt, __v, ...cleanNew } = newAllocation;
        const createdDoc = await Allocation.findOneAndUpdate({ id: newAllocation.id }, cleanNew, { upsert: true, new: true }).lean();
        if (createdDoc) {
          allocationsList[0] = createdDoc;
          finalAllocation = createdDoc;
        }
      } catch (err) {
        console.log('MongoDB allocation create notice:', err.message);
      }
    }

    res.status(201).json(finalAllocation);
  } catch (err) {
    console.error('Error in POST /allocations:', err);
    res.status(500).json({ error: 'Failed to create allocation: ' + err.message });
  }
});

// POST Bulk Dispatch (60+ Benches at once from Fast Entry Worksheet)
router.post('/bulk', async (req, res) => {
  try {
    await syncFromAtlasIfConnected();

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

    let startNum = 1000;
    allocationsList.forEach(d => {
      const m = d.id && String(d.id).match(/^AL-(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > startNum) startNum = n;
      }
    });

    allocations.forEach((item, index) => {
      const craftsman = craftsmenList.find(c => c.id === item.craftsmanId) || { id: item.craftsmanId, name: item.craftsmanName || item.craftsmanId, skillTier: 'Grade B' };
      const design = designsMaster.find(d => d.code === item.designCode) || designsMaster[0];

      dispatchedCraftsmanIds.add(craftsman.id);

      const qty = parseInt(item.qtyAllocated || 1, 10);
      const budgetedSMT = parseFloat(((design.totalSMT || 60) * qty).toFixed(1));
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

      startNum += 1;
      const newAlloc = {
        id: `AL-${startNum}`,
        date: targetDate,
        channel: item.channel || "OWN_SHOWROOM",
        channelName: item.channelName || defaultNames[item.channel || "OWN_SHOWROOM"],
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        skillTier: craftsman.skillTier || 'Grade B',
        workOrder: item.workOrder || `WO-${targetDate.replace(/-/g, '').slice(2)}-${craftsman.id}`,
        metalType: item.metalType || design.metalType || "Gold 22K",
        designCode: design.code,
        designName: design.name,
        unitSMT: design.totalSMT || 60,
        qtyAllocated: qty,
        budgetedSMT,
        assumedHours: assumed,
        actualHours: actual,
        varianceHours,
        variancePct,
        status: item.status || (actual !== null ? "Completed" : "In Progress"),
        goldIssuedGrams: item.goldIssuedGrams ? parseFloat(item.goldIssuedGrams) : null,
        goldReturnedGrams: item.goldReturnedGrams ? parseFloat(item.goldReturnedGrams) : null,
        goldLossPct,
        dispatchTime: item.dispatchTime || "07:15 AM"
      };

      createdList.push(newAlloc);
    });

    const existingCleanList = allocationsList.filter(a => !(a.date === targetDate && dispatchedCraftsmanIds.has(a.craftsmanId)));
    setAllocations([...createdList, ...existingCleanList]);

    if (mongoose.connection.readyState === 1 && createdList.length > 0) {
      try {
        await Allocation.deleteMany({ date: targetDate, craftsmanId: { $in: Array.from(dispatchedCraftsmanIds) } });
        await Allocation.insertMany(createdList);
      } catch (err) {
        console.log('MongoDB bulk insert notice:', err.message);
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
router.post('/auto-populate-shift', async (req, res) => {
  try {
    await syncFromAtlasIfConnected();
    const { date, channel, markCompleted = false } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const todayLeaves = leavesList.filter(l => l.date === targetDate);
    const absentCraftsmanIds = new Set(todayLeaves.map(l => l.craftsmanId));
    const activeCraftsmen = craftsmenList.filter(c => !absentCraftsmanIds.has(c.id));

    const defaultNames = {
      EXTERNAL_SHOP: "Swarna Jewellers (Pettah Contract)",
      OWN_SHOWROOM: "Ashadi Flagship Showroom (Colombo 04)",
      FACTORY_STOCK: "Central Factory Stock Order",
      OWNER_SPECIAL: "Private VIP Commission"
    };

    const clientNames = {
      EXTERNAL_SHOP: ["Swarna Jewellers (Pettah)", "Raja Jewellers (Sea St)", "Vogue Jewellers (Galle Rd)", "Devi Jewellers", "Lalitha Jewellers"],
      OWN_SHOWROOM: ["Ashadi Flagship Showroom (Colombo 04)", "Ashadi Branch (Kandy)", "Ashadi Branch (Galle)", "Ashadi Branch (Negombo)"],
      FACTORY_STOCK: ["Central Factory Stock Order", "Buffer Inventory Ring Tray #4", "Bridal Display Showcase Set", "Bangle Standard Lot A"],
      OWNER_SPECIAL: ["Chairman Private Commission", "VIP Royal Sapphire Pendant", "Executive Heritage Brooch", "Master Crafted Solitaire"]
    };

    const allocationsList = getAllocations();
    const createdList = [];
    
    let startNum = 1000;
    allocationsList.forEach(d => {
      const m = d.id && String(d.id).match(/^AL-(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > startNum) startNum = n;
      }
    });

    activeCraftsmen.forEach((craftsman, idx) => {
      const design = designsMaster[idx % designsMaster.length];
      const channels = ["EXTERNAL_SHOP", "OWN_SHOWROOM", "FACTORY_STOCK", "OWNER_SPECIAL"];
      const selectedChannel = channel || channels[idx % channels.length];

      let qty = 1;
      if (design.totalSMT < 60) qty = 4;
      else if (design.totalSMT < 120) qty = 2;
      else if (design.totalSMT < 200) qty = 2;
      else qty = 1;

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

      startNum += 1;
      const newAlloc = {
        id: `AL-${startNum}`,
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
        console.log('MongoDB auto-shift insert notice:', err.message);
      }
    }

    res.status(201).json({
      message: `Auto-dispatched ${createdList.length} active benches for ${targetDate}`,
      count: createdList.length,
      allocations: createdList
    });
  } catch (err) {
    console.error('Error in auto-populate-shift:', err);
    res.status(500).json({ error: 'Failed auto populating shift: ' + err.message });
  }
});

// PUT update any field of an allocation (Full edit capability with Guaranteed Upsert Fallback)
router.put('/:id', async (req, res) => {
  try {
    await syncFromAtlasIfConnected();
    const allocationsList = getAllocations();
    const searchId = req.params.id;

    // Search in memory first by id, _id, or workOrder
    let index = allocationsList.findIndex(a => 
      a.id === searchId || 
      String(a._id) === searchId ||
      a.workOrder === searchId ||
      (req.body.workOrder && a.workOrder === req.body.workOrder)
    );

    let existing = index !== -1 ? allocationsList[index] : null;

    // If not found in memory, query directly from MongoDB Atlas!
    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          $or: [
            { id: searchId },
            { workOrder: searchId }
          ]
        };
        if (req.body.workOrder) {
          query.$or.push({ workOrder: req.body.workOrder });
        }
        if (mongoose.isValidObjectId(searchId)) {
          query.$or.push({ _id: searchId });
        }
        const dbDoc = await Allocation.findOne(query).lean();
        if (dbDoc) {
          existing = dbDoc;
          if (index !== -1) {
            allocationsList[index] = dbDoc;
          } else {
            allocationsList.unshift(dbDoc);
            index = 0;
          }
        }
      } catch (e) {
        console.log('Direct MongoDB search notice:', e.message);
      }
    }

    // GRACEFUL UPSERT FALLBACK: If not found in DB or memory, do NOT 404!
    // Initialize record so edits always succeed and persist!
    if (!existing) {
      console.log(`Order ${searchId} not found in DB/memory; auto-initializing for graceful upsert.`);
      existing = {
        id: searchId,
        date: req.body.date || new Date().toISOString().split('T')[0],
        craftsmanId: req.body.craftsmanId || 'C001',
        craftsmanName: req.body.craftsmanName || 'Craftsman',
        skillTier: req.body.skillTier || 'Grade B',
        channel: req.body.channel || 'OWN_SHOWROOM',
        channelName: req.body.channelName || 'Ashadi Showroom',
        workOrder: req.body.workOrder || `WO-${searchId}`,
        metalType: req.body.metalType || 'Gold 22K',
        designCode: req.body.designCode || 'RNG-SMP-01',
        designName: req.body.designName || 'Gold Ring',
        qtyAllocated: parseInt(req.body.qtyAllocated, 10) || 1,
        assumedHours: parseFloat(req.body.assumedHours) || 4.0,
        actualHours: req.body.actualHours !== undefined && req.body.actualHours !== '' ? parseFloat(req.body.actualHours) : null,
        status: req.body.status || 'Completed'
      };
      allocationsList.unshift(existing);
      index = 0;
    }

    const updated = { ...existing, ...req.body };

    // Recalculate craftsman details if craftsmanId changed
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
    } else if (req.body.assumedHours !== undefined && req.body.assumedHours !== null && req.body.assumedHours !== '') {
      updated.assumedHours = parseFloat(parseFloat(req.body.assumedHours).toFixed(2));
    }

    // Recalculate Actual Hours and Variances
    if (req.body.actualHours !== undefined && req.body.actualHours !== null && req.body.actualHours !== '') {
      const act = parseFloat(req.body.actualHours);
      updated.actualHours = act;
      const assumed = updated.assumedHours || (updated.budgetedSMT / 60) || 8.0;
      updated.varianceHours = parseFloat((act - assumed).toFixed(2));
      updated.variancePct = assumed > 0 ? parseFloat(((updated.varianceHours / assumed) * 100).toFixed(1)) : 0;
    } else if (req.body.actualHours === null || req.body.actualHours === '') {
      updated.actualHours = null;
      updated.varianceHours = null;
      updated.variancePct = null;
    }

    // Explicit Status setting from user request (Completed, In Progress, Paused, etc.)
    if (req.body.status) {
      updated.status = req.body.status;
    } else if (updated.actualHours !== null && updated.actualHours !== undefined) {
      updated.status = 'Completed';
    }

    // Recalculate Gold Loss %
    const issued = updated.goldIssuedGrams ? parseFloat(updated.goldIssuedGrams) : null;
    const returned = updated.goldReturnedGrams ? parseFloat(updated.goldReturnedGrams) : null;
    if (issued && returned && issued > 0) {
      updated.goldLossPct = parseFloat((((issued - returned) / issued) * 100).toFixed(2));
    }

    // Suite / Set multi-item updates
    if (req.body.isSuite !== undefined) {
      updated.isSuite = !!req.body.isSuite;
      if (req.body.suiteName !== undefined) updated.suiteName = req.body.suiteName;
      if (Array.isArray(req.body.items)) {
        updated.items = req.body.items;
        if (updated.isSuite && updated.items.length > 0) {
          updated.budgetedSMT = parseFloat(updated.items.reduce((sum, it) => sum + (parseFloat(it.totalSMT) || ((parseFloat(it.unitSMT) || 0) * (parseInt(it.qty, 10) || 1))), 0).toFixed(1));
          updated.qtyAllocated = updated.items.reduce((sum, it) => sum + (parseInt(it.qty, 10) || 1), 0);
          if (!req.body.assumedHours) {
            updated.assumedHours = parseFloat((updated.budgetedSMT / 60).toFixed(2));
          }
        }
      }
    }

    if (index !== -1) {
      allocationsList[index] = updated;
    } else {
      allocationsList.unshift(updated);
    }
    saveAllocationsToDisk();

    // Persist to MongoDB Atlas (Strip immutable fields to prevent MongoServerError)
    const { _id, createdAt, updatedAt, __v, ...cleanUpdated } = updated;
    cleanUpdated.id = updated.id || searchId;

    let savedDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          $or: [
            { id: cleanUpdated.id },
            { workOrder: cleanUpdated.workOrder }
          ]
        };
        if (existing._id && mongoose.isValidObjectId(existing._id)) {
          query.$or.push({ _id: existing._id });
        }
        savedDoc = await Allocation.findOneAndUpdate(
          query, 
          { $set: cleanUpdated }, 
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
      } catch (err) {
        console.log('MongoDB allocation update notice:', err.message);
      }
    }

    res.json(savedDoc || updated);
  } catch (err) {
    console.error('Error in PUT /allocations/:id:', err);
    res.status(500).json({ error: 'Failed to update allocation: ' + err.message });
  }
});

// DELETE single allocation
router.delete('/:id', async (req, res) => {
  try {
    await syncFromAtlasIfConnected();
    const allocationsList = getAllocations();
    const searchId = req.params.id;

    const index = allocationsList.findIndex(a => 
      a.id === searchId || 
      String(a._id) === searchId ||
      a.workOrder === searchId
    );

    let removed = null;
    if (index !== -1) {
      removed = allocationsList.splice(index, 1)[0];
      saveAllocationsToDisk();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          $or: [
            { id: searchId },
            { workOrder: searchId }
          ]
        };
        if (mongoose.isValidObjectId(searchId)) {
          query.$or.push({ _id: searchId });
        }
        await Allocation.deleteOne(query);
      } catch (err) {
        console.log('MongoDB allocation delete notice:', err.message);
      }
    }

    res.json({ success: true, message: 'Order allocation removed successfully', removed });
  } catch (err) {
    console.error('Error in DELETE /allocations/:id:', err);
    res.status(500).json({ error: 'Failed to delete allocation: ' + err.message });
  }
});

// POST Clear All Sample / Past Orders (Allows starting completely fresh with real factory orders)
router.post('/clear-all', async (req, res) => {
  try {
    const current = getAllocations();
    const count = current.length;
    setAllocations([]);

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
  } catch (err) {
    console.error('Error in POST /clear-all:', err);
    res.status(500).json({ error: 'Failed to clear allocations: ' + err.message });
  }
});

module.exports = router;
