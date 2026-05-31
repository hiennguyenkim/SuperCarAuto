const mongoose = require('mongoose');

const QuoteRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true, match: /^0\d{8,10}$/ },
  email: { type: String, required: true },
  purchaseMethod: String,
  message: String,
  status: {
    type: String,
    enum: ['new', 'processing', 'sent', 'closed', 'cancelled'],
    default: 'new'
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('QuoteRequest', QuoteRequestSchema);
