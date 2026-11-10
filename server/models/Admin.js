const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, default: 'Factory Executive Admin' },
  role: { type: String, default: 'SUPER_ADMIN' },
  salt: { type: String, required: true },
  passwordHash: { type: String, required: true },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
