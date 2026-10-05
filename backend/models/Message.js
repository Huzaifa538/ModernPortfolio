const mongoose = require('mongoose');

// Messages coming in from the public contact form.
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: String,
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
