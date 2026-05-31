const { protect } = require('./authMiddleware');

const requireAuth = protect;

const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Yêu cầu đăng nhập.' });
  }
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ nhân viên và quản trị viên mới có quyền.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Yêu cầu đăng nhập.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ quản trị viên mới có quyền.' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireStaff,
  requireAdmin
};
