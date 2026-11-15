const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { hashPassword } = require('../utils/jwt');

const dataFilePath = path.join(__dirname, 'adminData.json');
const supervisorFilePath = path.join(__dirname, 'supervisorData.json');
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'ashadi@admin2026';
const WORKSHOP_DEFAULT_PASSWORD = process.env.WORKSHOP_DEFAULT_PASSWORD || 'workshop@2026';

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

// Helper to load supervisor from disk
const loadSupervisorFromDisk = () => {
  try {
    if (fs.existsSync(supervisorFilePath)) {
      const raw = fs.readFileSync(supervisorFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading supervisorData.json:', err.message);
  }
  return null;
};

// Helper to save supervisor to disk
const saveSupervisorToDisk = (supervisorData) => {
  try {
    fs.writeFileSync(supervisorFilePath, JSON.stringify(supervisorData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing supervisorData.json:', err.message);
  }
};

// Generate default admin record (Super Admin / Owner)
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

// Generate default supervisor record (Workshop Supervisor)
const createDefaultSupervisor = () => {
  const { salt, hash } = hashPassword(WORKSHOP_DEFAULT_PASSWORD);
  return {
    id: 'user_supervisor_002',
    username: 'workshop',
    email: 'workshop@ashadijewellers.com',
    name: 'Workshop Floor Supervisor',
    role: 'SUPERVISOR',
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
}

let currentSupervisor = loadSupervisorFromDisk();
if (!currentSupervisor) {
  currentSupervisor = createDefaultSupervisor();
  saveSupervisorToDisk(currentSupervisor);
}

// Sync with MongoDB Atlas if available
const syncAdminFromAtlas = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      // 1. Sync Super Admin (NEVER overwrite existing credentials in MongoDB Atlas)
      let dbAdmin = await Admin.findOne({ username: 'admin' }).lean();
      if (!dbAdmin) {
        await Admin.create(currentAdmin);
        console.log('Seeded Admin account into MongoDB Atlas');
      } else {
        currentAdmin = dbAdmin;
        saveAdminToDisk(dbAdmin);
      }

      // 2. Sync Workshop Supervisor account
      let dbSupervisor = await Admin.findOne({ username: 'workshop' }).lean();
      if (!dbSupervisor) {
        await Admin.create(currentSupervisor);
        console.log('Seeded Workshop Supervisor account into MongoDB Atlas');
      } else {
        currentSupervisor = dbSupervisor;
        saveSupervisorToDisk(dbSupervisor);
      }
    } catch (err) {
      console.log('Notice syncing accounts from MongoDB Atlas:', err.message);
    }
  }
};

const getAdmin = () => currentAdmin;
const getSupervisor = () => currentSupervisor;

// Lookup user by username or email across DB and disk
const findUser = async (identifier) => {
  const trimmed = (identifier || '').trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await Admin.findOne({
        $or: [
          { username: trimmed },
          { email: trimmed }
        ]
      }).lean();
      if (dbUser) return dbUser;
    } catch (e) {
      console.log('Notice looking up user in MongoDB Atlas:', e.message);
    }
  }

  // Fallback to in-memory/disk
  if (currentAdmin && (currentAdmin.username.toLowerCase() === trimmed || currentAdmin.email.toLowerCase() === trimmed)) {
    return currentAdmin;
  }
  if (currentSupervisor && (currentSupervisor.username.toLowerCase() === trimmed || currentSupervisor.email.toLowerCase() === trimmed)) {
    return currentSupervisor;
  }
  return null;
};

// Update user details (e.g. lastLogin or password)
const updateUser = async (username, updates) => {
  const trimmed = (username || '').trim().toLowerCase();
  if (trimmed === 'admin') {
    currentAdmin = { ...currentAdmin, ...updates, updatedAt: new Date().toISOString() };
    saveAdminToDisk(currentAdmin);
    if (mongoose.connection.readyState === 1) {
      try {
        await Admin.findOneAndUpdate({ username: 'admin' }, currentAdmin, { upsert: true });
      } catch (e) {}
    }
    return currentAdmin;
  }
  if (trimmed === 'workshop') {
    currentSupervisor = { ...currentSupervisor, ...updates, updatedAt: new Date().toISOString() };
    saveSupervisorToDisk(currentSupervisor);
    if (mongoose.connection.readyState === 1) {
      try {
        await Admin.findOneAndUpdate({ username: 'workshop' }, currentSupervisor, { upsert: true });
      } catch (e) {}
    }
    return currentSupervisor;
  }
  return null;
};

const updateAdmin = async (updates) => updateUser('admin', updates);

const resetToDefaultPassword = async () => {
  const { salt, hash } = hashPassword(DEFAULT_PASSWORD);
  return updateUser('admin', { salt, passwordHash: hash });
};

module.exports = {
  getAdmin,
  getSupervisor,
  findUser,
  updateUser,
  updateAdmin,
  syncAdminFromAtlas,
  resetToDefaultPassword,
  DEFAULT_PASSWORD,
  WORKSHOP_DEFAULT_PASSWORD
};
