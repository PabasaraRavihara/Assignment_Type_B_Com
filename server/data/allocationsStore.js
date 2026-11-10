const fs = require('fs');
const path = require('path');
const initialData = require('./initialData');

const allocationsFilePath = path.join(__dirname, 'allocationsData.json');

let liveAllocations = null;

function initStore() {
  if (liveAllocations !== null) {
    return liveAllocations;
  }
  if (fs.existsSync(allocationsFilePath)) {
    try {
      const raw = fs.readFileSync(allocationsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        liveAllocations = parsed;
        return liveAllocations;
      }
    } catch (e) {
      console.log('Notice reading allocationsData.json:', e.message);
    }
  }
  // Fallback to initialData.allocationsList and write to disk
  liveAllocations = [...initialData.allocationsList];
  try {
    fs.writeFileSync(allocationsFilePath, JSON.stringify(liveAllocations, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to create initial allocationsData.json:', err.message);
  }
  return liveAllocations;
}

function getAllocations() {
  return initStore();
}

function setAllocations(newList) {
  liveAllocations = Array.isArray(newList) ? newList : [];
  try {
    fs.writeFileSync(allocationsFilePath, JSON.stringify(liveAllocations, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write allocationsData.json:', err.message);
  }
  return liveAllocations;
}

function saveAllocationsToDisk() {
  return setAllocations(liveAllocations || initStore());
}

module.exports = {
  getAllocations,
  setAllocations,
  saveAllocationsToDisk,
  allocationsFilePath
};
