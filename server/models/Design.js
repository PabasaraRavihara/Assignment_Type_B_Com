const mongoose = require('mongoose');

const operationStepSchema = new mongoose.Schema({
  seq: { type: Number, required: true },
  opId: { type: String, required: true },
  opName: { type: String, required: true },
  ot: { type: Number, required: true },
  rating: { type: Number, default: 100 },
  allowance: { type: Number, default: 0.19 },
  st: { type: Number, required: true }
});

const designSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Ring' },
  goldKarat: { type: String, default: '22K' },
  totalSMT: { type: Number, required: true },
  skillTier: { type: String, default: 'Grade B' },
  minuteRate: { type: Number, required: true },
  labourCost: { type: Number, required: true },
  allowableGoldLossPct: { type: Number, default: 3.0 },
  description: { type: String, default: '' },
  operations: [operationStepSchema]
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
