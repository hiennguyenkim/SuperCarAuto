const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [String],
  isVisible: { type: Boolean, default: true },
  replyComment: { type: String },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  repliedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema);
