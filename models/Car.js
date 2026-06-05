const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  collection: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
  model: String,
  version: String,
  year: Number,
  bodyType: String,
  price: { type: Number, required: true },
  oldPrice: Number,
  depositAmount: { type: Number, required: true },
  images: [String],
  videoUrl: String,
  condition: { type: String, enum: ['new', 'used', 'consignment', 'imported'] },
  mileage: { type: Number, default: 0 },
  origin: String,
  showroom: String,
  exteriorColor: String,
  interiorColor: String,
  interiorMaterial: String,
  engine: String,
  engineCapacity: String,
  horsepower: Number,
  torque: Number,
  transmission: String,
  drivetrain: String,
  fuelType: String,
  acceleration: String,
  maxSpeed: String,
  seats: Number,
  options: [String],
  safetyFeatures: [String],
  entertainmentFeatures: [String],
  legalStatus: String,
  licensePlate: String,
  registrationStatus: String,
  inspectionStatus: String,
  warranty: String,
  description: String,
  allowTestDrive: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'hidden', 'checking', 'coming_soon', 'consignment'],
    default: 'available'
  },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Car', CarSchema);
