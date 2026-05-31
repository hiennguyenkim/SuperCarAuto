const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  targetType: String,
  targetId: mongoose.Schema.Types.ObjectId,
  oldData: mongoose.Schema.Types.Mixed,
  newData: mongoose.Schema.Types.Mixed,
  ipAddress: String
}, {
  timestamps: { createdAt: true, updatedAt: false } // only logs creation time
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
