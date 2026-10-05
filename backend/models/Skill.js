const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Frontend', 'Backend', 'Database', 'Tools', 'Other'],
      default: 'Other',
    },
    level: { type: Number, min: 0, max: 100, default: 70 },
    iconUrl: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
