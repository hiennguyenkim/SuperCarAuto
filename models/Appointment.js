const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^0\d{8,10}$/ },
    email: { type: String, required: true },
    note: String
  },
  showroom: String,
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  groupSize: { type: Number, default: 1 },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'contacted', 'visited', 'completed', 'cancelled'],
    default: 'pending'
  },
  staffNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
