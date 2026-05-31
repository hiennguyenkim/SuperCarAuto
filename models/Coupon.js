const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  applyBrand: String,
  applyCategory: String,
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', CouponSchema);
