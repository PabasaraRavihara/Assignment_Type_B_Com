const fs = require('fs');
const path = require('path');
const initialData = require('./initialData');

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const allocationsFilePath = isServerless 
  ? path.join('/tmp', 'allocationsData.json') 
  : path.join(__dirname, 'allocationsData.json');

const bundledFilePath = path.join(__dirname, 'allocationsData.json');

let liveAllocations = null;

function initStore() {
  if (liveAllocations !== null) {
    return liveAllocations;
  }
  if (fs.existsSync(allocationsFilePath)) {
    try {
      const raw = fs.readFileSync(allocationsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        liveAllocations = parsed;
        return liveAllocations;
      }
    } catch (e) {
      console.log('Notice reading allocationsData.json:', e.message);
    }
  }

  // If serverless, check bundled file if writable /tmp is not yet initialized
  if (isServerless && fs.existsSync(bundledFilePath)) {
    try {
      const raw = fs.readFileSync(bundledFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        liveAllocations = parsed;
        return liveAllocations;
      }
    } catch (e) {}
  }

  // Fallback to initialData.allocationsList and write to writable location
  liveAllocations = [...initialData.allocationsList];
  try {
    fs.writeFileSync(allocationsFilePath, JSON.stringify(liveAllocations, null, 2), 'utf8');
  } catch (err) {
    // Gracefully ignore on read-only environments
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
    // Gracefully ignore on read-only environments
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
