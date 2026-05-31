const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  deposit: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit' },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^0\d{8,10}$/ },
    email: { type: String, required: true },
    address: { type: String, required: true },
    note: String
  },
  carInfo: {
    code: String,
    name: String,
    brand: String,
    model: String,
    year: Number,
    price: Number
  },
  carPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'installment'], required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'deposit_paid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  orderStatus: {
    type: String,
    enum: [
      'consulting',
      'waiting_deposit',
      'deposited',
      'waiting_full_payment',
      'paid',
      'processing_paperwork',
      'delivering',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'consulting'
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffNote: String,
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
