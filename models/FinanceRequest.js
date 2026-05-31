const mongoose = require('mongoose');

const FinanceRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true, match: /^0\d{8,10}$/ },
  email: { type: String, required: true },
  carPrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  loanAmount: { type: Number, required: true },
  loanTerm: { type: Number, required: true }, // in months
  expectedMonthlyPayment: Number,
  monthlyIncome: Number,
  preferredBank: String,
  note: String,
  status: {
    type: String,
    enum: ['new', 'processing', 'approved', 'rejected', 'closed'],
    default: 'new'
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('FinanceRequest', FinanceRequestSchema);
