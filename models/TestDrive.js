const mongoose = require('mongoose');

const TestDriveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^0\d{8,10}$/ },
    email: { type: String, required: true },
    note: String
  },
  showroom: String,
  testDriveDate: { type: Date, required: true },
  testDriveTime: { type: String, required: true },
  drivingExperience: String,
  licenseImage: String,
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'tested', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TestDrive', TestDriveSchema);
