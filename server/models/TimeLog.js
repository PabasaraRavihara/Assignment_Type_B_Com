const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  allocId: { type: String, default: '' },
  craftsmanId: { type: String, required: true },
  craftsmanName: { type: String, required: true },
  clockIn: { type: String, required: true },
  clockOut: { type: String, required: true },
  breakMin: { type: Number, default: 60 },
  awm: { type: Number, required: true },
  designCode: { type: String, required: true },
  completedQty: { type: Number, default: 0 },
  passedQA: { type: Number, default: 0 },
  reworkQty: { type: Number, default: 0 },
  esm: { type: Number, required: true },
  efficiency: { type: Number, required: true },
  minuteRate: { type: Number, required: true },
  basePay: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  totalPay: { type: Number, required: true },
  goldLossPct: { type: Number, default: 3.0 }
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);
