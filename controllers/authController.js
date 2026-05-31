const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supercar_luxury_ultra_secure_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Set HTTP-only Cookie with Secure parameters based on feedback
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Strip password
  const responseUser = {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isActive: user.isActive
  };

  res.status(statusCode).json({
    success: true,
    user: responseUser
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, username, email, phone, address, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Tên tài khoản hoặc email đã tồn tại.' });
    }

    // Create user (role defaults to 'user')
    const user = await User.create({
      fullName,
      username,
      email,
      phone,
      address,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Vui lòng điền tên đăng nhập/email và mật khẩu.' });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Thông tin tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản này đã bị tạm khóa.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000)
  });
  res.status(200).json({ success: true, message: 'Đăng xuất thành công.' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
    }

    const user = await User.findById(req.user.id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Mật khẩu đã được thay đổi thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
    }

    // In a real application, we would generate a token and send a real email.
    // For this development project, we return a mock success message indicating token generation.
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supercar_luxury_ultra_secure_secret_key_2026', {
      expiresIn: '10m' // Reset link valid for 10 minutes
    });

    console.log(`[FORGOT PASSWORD] Reset link generated for ${email}: /views/reset-password.html?token=${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn.',
      token: resetToken // Exposing for simulation in developer console / UI
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone, address } = req.body;
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác.' });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (phone) {
      const phoneRegex = /^0\d{8,10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ!' });
      }
      user.phone = phone;
    }
    if (address !== undefined) user.address = address;

    await user.save();

    // Strip password
    const responseUser = {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isActive: user.isActive
    };

    res.status(200).json({ success: true, user: responseUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

