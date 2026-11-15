const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  craftsmanId: { type: String, required: true },
  craftsmanName: { type: String, required: true },
  empNo: { type: String, default: '' },
  date: { type: String, required: true },
  leaveType: { 
    type: String, 
    default: 'Full Day Leave (13h)' 
  },
  hoursDeducted: { type: Number, required: true, default: 13.0 },
  reason: { type: String, default: 'Personal / Family leave' },
  status: { type: String, default: 'Approved' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

leaveSchema.index({ craftsmanId: 1, date: 1 });

module.exports = mongoose.model('Leave', leaveSchema);

