const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  depositCode: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^0\d{8,10}$/ },
    email: { type: String, required: true },
    note: String
  },
  depositAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'e_wallet'], required: true },
  paymentProof: String,
  expiredAt: Date,
  status: {
    type: String,
    enum: ['pending_payment', 'pending_confirm', 'confirmed', 'expired', 'cancelled', 'refunded', 'converted_to_order'],
    default: 'pending_payment'
  },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Deposit', DepositSchema);
