const mongoose = require('mongoose');

// Admin account. Password hash is never returned in queries (select: false).
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
