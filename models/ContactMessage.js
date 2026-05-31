const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, match: /^0\d{8,10}$/ },
  subject: String,
  message: { type: String, required: true },
  relatedCar: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
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
