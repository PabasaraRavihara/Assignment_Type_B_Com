const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  craftsmanId: { type: String, required: true },
  craftsmanName: { type: String, required: true },
  date: { type: String, required: true },
  leaveType: { 
    type: String, 
    enum: [
      'Full Day Leave (13h)', 
      'Half Day Leave (6.5h)', 
      'Medical Leave (13h)', 
      'Authorized Casual (13h)', 
      'Unauthorized Absent (13h)'
    ], 
    default: 'Full Day Leave (13h)' 
  },
  hoursDeducted: { type: Number, required: true, default: 13.0 },
  reason: { type: String, default: 'Personal / Family leave' },
  status: { type: String, enum: ['Approved', 'Pending', 'Unexcused'], default: 'Approved' }
}, { timestamps: true });

leaveSchema.index({ craftsmanId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Leave', leaveSchema);
