const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ClientShop = require('../models/ClientShop');
const { getAllocations } = require('../data/allocationsStore');

const dataFilePath = path.join(__dirname, '../data/clientShopsData.json');

// Helper to read shops from disk
const loadShopsFromDisk = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading clientShopsData.json:', err.message);
  }
  return [];
};

// Helper to save shops to disk
const saveShopsToDisk = (shops) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(shops, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving clientShopsData.json:', err.message);
  }
};

let inMemoryShops = loadShopsFromDisk();

// Helper to sync from MongoDB Atlas if available
const syncFromAtlasIfConnected = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const dbShops = await ClientShop.find().sort({ createdAt: -1 }).lean();
      if (dbShops && dbShops.length > 0) {
        inMemoryShops = dbShops;
        saveShopsToDisk(dbShops);
      }
    } catch (err) {
      console.log('MongoDB client shops fetch notice:', err.message);
    }
  }
};

// GET all client shops with live metrics from allocations
router.get('/', async (req, res) => {
  await syncFromAtlasIfConnected();

  const allocations = getAllocations();

  const enrichedShops = inMemoryShops.map(shop => {
    // Find all allocations that match this shop name
    const shopOrders = allocations.filter(a => 
      a.channel === 'EXTERNAL_SHOP' && 
      a.channelName && 
      (a.channelName.toLowerCase().includes(shop.name.toLowerCase()) || shop.name.toLowerCase().includes(a.channelName.toLowerCase()))
    );

    let totalPieces = 0;
    let totalMetalIssued = 0;
    let totalMetalReturned = 0;

    shopOrders.forEach(a => {
      totalPieces += a.qtyAllocated || 1;
      if (a.goldIssuedGrams) totalMetalIssued += a.goldIssuedGrams;
      if (a.goldReturnedGrams) totalMetalReturned += a.goldReturnedGrams;
    });

    const totalScrapGrams = parseFloat((totalMetalIssued - totalMetalReturned).toFixed(3));
    const avgScrapLossPct = totalMetalIssued > 0 
      ? parseFloat(((totalScrapGrams / totalMetalIssued) * 100).toFixed(2)) 
      : null;

    return {
      ...shop,
      ordersCount: shopOrders.length,
      piecesCount: totalPieces,
      metalIssuedGrams: parseFloat(totalMetalIssued.toFixed(2)),
      avgScrapLossPct
    };
  });

  res.json({
    total: enrichedShops.length,
    shops: enrichedShops
  });
});

// POST add a new external partner jeweller shop
router.post('/', async (req, res) => {
  const { name, location, contactPerson, phone, agreedLossPct, billingModel, notes } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Shop Name is required' });
  }

  const existingShop = inMemoryShops.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
  if (existingShop) {
    return res.status(400).json({ error: `A client shop with name "${name}" already exists.` });
  }

  const newId = `SHOP-${String(inMemoryShops.length + 1).padStart(3, '0')}`;

  const newShop = {
    id: newId,
    name: name.trim(),
    location: location ? location.trim() : 'Colombo / Suburbs',
    contactPerson: contactPerson ? contactPerson.trim() : '',
    phone: phone ? phone.trim() : '',
    agreedLossPct: agreedLossPct ? parseFloat(agreedLossPct) : 3.5,
    billingModel: billingModel ? billingModel.trim() : 'Contract SMT + 3.5% Loss',
    category: 'External Retail Jeweller (B2B)',
    notes: notes ? notes.trim() : 'Registered external B2B retail client',
    status: 'Active'
  };

  inMemoryShops.push(newShop);
  saveShopsToDisk(inMemoryShops);

  if (mongoose.connection.readyState === 1) {
    try {
      await ClientShop.create(newShop);
    } catch (err) {
      console.log('MongoDB client shop create notice:', err.message);
    }
  }

  res.status(201).json(newShop);
});

// PUT update shop details
router.put('/:id', async (req, res) => {
  const index = inMemoryShops.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Shop not found' });

  const updated = { ...inMemoryShops[index], ...req.body };
  if (req.body.agreedLossPct) updated.agreedLossPct = parseFloat(req.body.agreedLossPct);

  inMemoryShops[index] = updated;
  saveShopsToDisk(inMemoryShops);

  if (mongoose.connection.readyState === 1) {
    try {
      await ClientShop.findOneAndUpdate({ id: req.params.id }, updated, { upsert: true, new: true });
    } catch (err) {
      console.log('MongoDB client shop update notice:', err.message);
    }
  }

  res.json(updated);
});

// DELETE client shop
router.delete('/:id', async (req, res) => {
  const index = inMemoryShops.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Shop not found' });

  const removed = inMemoryShops.splice(index, 1);
  saveShopsToDisk(inMemoryShops);

  if (mongoose.connection.readyState === 1) {
    try {
      await ClientShop.deleteOne({ id: req.params.id });
    } catch (err) {
      console.log('MongoDB client shop delete notice:', err.message);
    }
  }

  res.json({ success: true, message: 'Client shop removed', removed: removed[0] });
});

module.exports = router;
