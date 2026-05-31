const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    return res.status(401).json({ message: 'Yêu cầu đăng nhập để thực hiện hành động này.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supercar_luxury_ultra_secure_secret_key_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản này đã bị tạm khóa.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Phiên làm việc hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
  }
};

module.exports = { protect };
