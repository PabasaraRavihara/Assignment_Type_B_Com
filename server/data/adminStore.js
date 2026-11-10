const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { hashPassword } = require('../utils/jwt');

const dataFilePath = path.join(__dirname, 'adminData.json');
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'ashadi@admin2026';

// Helper to load admin from disk
const loadAdminFromDisk = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading adminData.json:', err.message);
  }
  return null;
};

// Helper to save admin to disk
const saveAdminToDisk = (adminData) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(adminData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing adminData.json:', err.message);
  }
};

// Generate default admin record
const createDefaultAdmin = () => {
  const { salt, hash } = hashPassword(DEFAULT_PASSWORD);
  return {
    id: 'admin_master_001',
    username: 'admin',
    email: 'admin@ashadijewellers.com',
    name: 'Ashadi Executive Administrator',
    role: 'SUPER_ADMIN',
    salt,
    passwordHash: hash,
    lastLogin: null,
    createdAt: new Date().toISOString()
  };
};

let currentAdmin = loadAdminFromDisk();
if (!currentAdmin) {
  currentAdmin = createDefaultAdmin();
  saveAdminToDisk(currentAdmin);
  console.log('Initialized default Admin credentials (username: admin, password:', DEFAULT_PASSWORD, ')');
}

// Sync with MongoDB Atlas if available
const syncAdminFromAtlas = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      let dbAdmin = await Admin.findOne({ username: 'admin' }).lean();
      if (!dbAdmin) {
        // Seed to MongoDB Atlas
        await Admin.create(currentAdmin);
        console.log('Seeded Admin account into MongoDB Atlas');
      } else {
        currentAdmin = dbAdmin;
        saveAdminToDisk(dbAdmin);
      }
    } catch (err) {
      console.log('Notice syncing admin from MongoDB Atlas:', err.message);
    }
  }
};

const getAdmin = () => currentAdmin;

const updateAdmin = async (updates) => {
  currentAdmin = { ...currentAdmin, ...updates, updatedAt: new Date().toISOString() };
  saveAdminToDisk(currentAdmin);

  if (mongoose.connection.readyState === 1) {
    try {
      await Admin.findOneAndUpdate({ id: currentAdmin.id }, currentAdmin, { upsert: true });
    } catch (err) {
      console.error('Error updating admin in MongoDB Atlas:', err.message);
    }
  }
  return currentAdmin;
};

const resetToDefaultPassword = async () => {
  const { salt, hash } = hashPassword(DEFAULT_PASSWORD);
  return updateAdmin({ salt, passwordHash: hash });
};

module.exports = {
  getAdmin,
  updateAdmin,
  syncAdminFromAtlas,
  resetToDefaultPassword,
  DEFAULT_PASSWORD
};
