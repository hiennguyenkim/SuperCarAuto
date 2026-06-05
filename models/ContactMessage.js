const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, match: /^0\d{8,10}$/ },
  subject: String,
  message: { type: String, required: true },
  relatedCar: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  type: {
    type: String,
    enum: ['contact', 'support'],
    default: 'contact'
  },
  messages: [{
    sender: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['new', 'processing', 'done', 'rejected'],
    default: 'new'
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
