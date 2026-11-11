const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  channel: { 
    type: String, 
    enum: ['EXTERNAL_SHOP', 'OWN_SHOWROOM', 'FACTORY_STOCK', 'OWNER_SPECIAL'],
    default: 'OWN_SHOWROOM' 
  },
  channelName: { type: String, default: 'Ashadi Showroom' },
  craftsmanId: { type: String, required: true },
  craftsmanName: { type: String, required: true },
  skillTier: { type: String, default: 'Grade B' },
  workOrder: { type: String, required: true },
  metalType: { 
    type: String, 
    default: 'Gold 22K' 
  },
  designCode: { type: String, required: true },
  designName: { type: String, required: true },
  unitSMT: { type: Number, required: true },
  qtyAllocated: { type: Number, required: true, default: 1 },
  budgetedSMT: { type: Number, required: true },
  assumedHours: { type: Number, default: 8.0 },
  actualHours: { type: Number, default: null },
  varianceHours: { type: Number, default: null },
  variancePct: { type: Number, default: null },
  goldIssuedGrams: { type: Number, default: null },
  goldReturnedGrams: { type: Number, default: null },
  goldLossPct: { type: Number, default: null },
  dispatchTime: { type: String, default: null },
  pausedMinutes: { type: Number, default: 0 },
  status: { type: String, default: 'Completed' },
  budgetWarning: { type: String, default: null },
  isSuite: { type: Boolean, default: false },
  suiteName: { type: String, default: null },
  items: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Allocation', allocationSchema);
