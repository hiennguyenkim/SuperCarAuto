const User = require('../models/User');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Get all accounts (Admin)
// @route   GET /api/accounts
// @access  Private/Admin
exports.getAccounts = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ role: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single account details (Admin)
// @route   GET /api/accounts/:id
// @access  Private/Admin
exports.getAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create user/staff/admin account (Admin)
// @route   POST /api/accounts
// @access  Private/Admin
exports.createAccount = async (req, res) => {
  try {
    const { fullName, username, email, phone, address, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email hoặc tên đăng nhập đã được sử dụng.' });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      phone,
      address,
      password,
      role: role || 'user'
    });

    user.password = undefined;

    // Log action
    await createAuditLog(req.user._id, 'CREATE_ACCOUNT', 'User', user._id, null, user.toObject(), req);

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update account details (Admin)
// @route   PUT /api/accounts/:id
// @access  Private/Admin
exports.updateAccount = async (req, res) => {
  try {
    const { fullName, email, phone, address, role } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    // Safety constraint: Prevent changing self role
    if (req.params.id === req.user.id && role && role !== user.role) {
      return res.status(400).json({ message: 'Bạn không thể tự ý thay đổi chức vụ của chính mình.' });
    }

    const oldData = user.toObject();

    const updateFields = { fullName, email, phone, address };
    if (role) {
      updateFields.role = role;
    }

    user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });

    // Log audit
    await createAuditLog(req.user._id, 'UPDATE_ACCOUNT', 'User', user._id, oldData, user.toObject(), req);

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Lock account (Admin)
// @route   PUT /api/accounts/:id/lock
// @access  Private/Admin
exports.lockAccount = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình.' });
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    user.isActive = false;
    await user.save();

    await createAuditLog(req.user._id, 'LOCK_ACCOUNT', 'User', user._id, { isActive: true }, { isActive: false }, req);

    res.status(200).json({ success: true, message: 'Đã khóa tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Unlock account (Admin)
// @route   PUT /api/accounts/:id/unlock
// @access  Private/Admin
exports.unlockAccount = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    user.isActive = true;
    await user.save();

    await createAuditLog(req.user._id, 'UNLOCK_ACCOUNT', 'User', user._id, { isActive: false }, { isActive: true }, req);

    res.status(200).json({ success: true, message: 'Đã mở khóa tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Change user role (Admin)
// @route   PUT /api/accounts/:id/role
// @access  Private/Admin
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự thay đổi chức vụ của chính mình.' });
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    const oldData = user.toObject();
    user.role = role;
    await user.save();

    await createAuditLog(req.user._id, 'CHANGE_ROLE', 'User', user._id, oldData, user.toObject(), req);

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete account (Admin only - prevents self-delete)
// @route   DELETE /api/accounts/:id
// @access  Private/Admin
exports.deleteAccount = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Hành động từ chối. Bạn đang đăng nhập bằng tài khoản này.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await createAuditLog(req.user._id, 'DELETE_ACCOUNT', 'User', user._id, user.toObject(), null, req);

    res.status(200).json({ success: true, message: 'Đã xóa tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
