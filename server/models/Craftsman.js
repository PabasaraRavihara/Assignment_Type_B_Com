const mongoose = require('mongoose');

const craftsmanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  originalNo: { type: Number },
  name: { type: String, required: true },
  empNo: { type: String, default: '' },
  dept: { type: String, default: 'Workshop' },
  skillTier: { type: String, enum: ['Grade A', 'Grade B', 'Grade C'], default: 'Grade B' },
  minuteRate: { type: Number, required: true },
  specialization: { type: String, default: 'General Goldsmith' },
  nvqLevel: { type: String, default: 'NVQ L3' },
  avgEfficiency: { type: Number, default: 80.0 },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Craftsman', craftsmanSchema);
