const AuditLog = require('../models/AuditLog');

const createAuditLog = async (userId, action, targetType, targetId, oldData, newData, req = null) => {
  try {
    let ipAddress = 'unknown';
    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    }

    await AuditLog.create({
      user: userId,
      action,
      targetType,
      targetId,
      oldData,
      newData,
      ipAddress
    });
  } catch (err) {
    console.error('AuditLog creation failure:', err.message);
  }
};

module.exports = createAuditLog;
