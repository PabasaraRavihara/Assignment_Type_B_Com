const mongoose = require('mongoose');

const clientShopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  phone: { type: String, default: '' },
  agreedLossPct: { type: Number, default: 3.5 },
  billingModel: { type: String, default: 'Contract SMT + 3.5% Loss' },
  category: { type: String, default: 'External Retail Jeweller (B2B)' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('ClientShop', clientShopSchema);
