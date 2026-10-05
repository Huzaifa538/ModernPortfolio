const mongoose = require('mongoose');

// Messages: two-way conversations between visitors and the admin.
// Each conversation is grouped by conversationId (one per visitor).
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['visitor', 'admin'], default: 'visitor' },
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
