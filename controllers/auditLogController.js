const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs (Admin only)
// @route   GET /api/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'fullName email username role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single audit log details (Admin only)
// @route   GET /api/audit-logs/:id
// @access  Private/Admin
exports.getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'fullName email username role');

    if (!log) {
      return res.status(404).json({ message: 'Không tìm thấy nhật ký hoạt động.' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
