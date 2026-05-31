const Deposit = require('../models/Deposit');
const Car = require('../models/Car');
const Order = require('../models/Order');
const generateOrderCode = require('../utils/generateOrderCode');
const deleteFile = require('../utils/deleteFile');
const createAuditLog = require('../utils/createAuditLog');

// Check and expire deposits
const checkAndExpireDeposits = async () => {
  try {
    const expiredDeposits = await Deposit.find({
      status: 'confirmed',
      expiredAt: { $lt: new Date() }
    });

    for (const deposit of expiredDeposits) {
      deposit.status = 'expired';
      await deposit.save();

      // Release the car back to available
      await Car.findByIdAndUpdate(deposit.car, { status: 'available' });

      // Create system audit log
      await createAuditLog(null, 'AUTO_EXPIRE_DEPOSIT', 'Deposit', deposit._id, { status: 'confirmed' }, { status: 'expired' });
      console.log(`[DEPOSIT AUTO-EXPIRE] Deposit ${deposit.depositCode} expired. Car status set to available.`);
    }
  } catch (err) {
    console.error('Error during auto-expiring deposits:', err.message);
  }
};

// @desc    Create deposit reservation (Race-condition safe)
// @route   POST /api/deposits
// @access  Private
exports.createDeposit = async (req, res) => {
  try {
    const { carId, customerInfo, depositAmount, paymentMethod } = req.body;

    // Run auto-expire check first to release any expired cars
    await checkAndExpireDeposits();

    // Atomic find and update to prevent race conditions (double bookings)
    const car = await Car.findOneAndUpdate(
      { _id: carId, status: 'available' },
      { $set: { status: 'reserved' } },
      { new: true }
    );

    if (!car) {
      return res.status(400).json({ message: 'Xe này không khả dụng hoặc vừa được đặt cọc bởi khách khác.' });
    }

    const depositCode = generateOrderCode('DEP');

    const deposit = await Deposit.create({
      depositCode,
      user: req.user.id,
      car: carId,
      customerInfo,
      depositAmount: depositAmount || car.depositAmount || (car.price * 0.05), // default 5%
      paymentMethod
    });

    // Write audit log
    await createAuditLog(req.user._id, 'CREATE_DEPOSIT', 'Deposit', deposit._id, null, deposit.toObject(), req);

    res.status(201).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all deposits (Staff/Admin)
// @route   GET /api/deposits
// @access  Private/Staff
exports.getDeposits = async (req, res) => {
  try {
    await checkAndExpireDeposits();

    const deposits = await Deposit.find()
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('handledBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: deposits.length, data: deposits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's deposits
// @route   GET /api/deposits/my-deposits
// @access  Private
exports.getMyDeposits = async (req, res) => {
  try {
    await checkAndExpireDeposits();

    const deposits = await Deposit.find({ user: req.user.id })
      .populate({ path: 'car', populate: 'brand' })
      .populate('handledBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: deposits.length, data: deposits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single deposit details
// @route   GET /api/deposits/:id
// @access  Private
exports.getDeposit = async (req, res) => {
  try {
    await checkAndExpireDeposits();

    const deposit = await Deposit.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('handledBy', 'fullName email');

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn đặt cọc.' });
    }

    if (deposit.user && deposit.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập hóa đơn của người khác.' });
    }

    res.status(200).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload payment proof
// @route   POST /api/deposits/:id/payment-proof
// @access  Private
exports.uploadPaymentProof = async (req, res) => {
  try {
    let deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn đặt cọc.' });
    }

    if (deposit.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Không có quyền thao tác.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng đính kèm ảnh minh chứng thanh toán.' });
    }

    // Delete old proof if exits
    if (deposit.paymentProof) {
      deleteFile(deposit.paymentProof);
    }

    deposit.paymentProof = `/public/uploads/proofs/${req.file.filename}`;
    deposit.status = 'pending_confirm';
    await deposit.save();

    res.status(200).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Confirm deposit receipt (Staff/Admin)
// @route   PUT /api/deposits/:id/confirm
// @access  Private/Staff
exports.confirmDeposit = async (req, res) => {
  try {
    let deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn đặt cọc.' });
    }

    const oldData = deposit.toObject();

    deposit.status = 'confirmed';
    deposit.handledBy = req.user.id;

    // Calculate expiredAt based on user feedback
    const expiryDays = parseInt(process.env.DEPOSIT_EXPIRY_DAYS || '7', 10);
    deposit.expiredAt = new Date(Date.now() + expiryDays * 86400000);

    await deposit.save();

    // Ensure car status is reserved
    await Car.findByIdAndUpdate(deposit.car, { status: 'reserved' });

    // Write audit log
    await createAuditLog(req.user._id, 'CONFIRM_DEPOSIT', 'Deposit', deposit._id, oldData, deposit.toObject(), req);

    res.status(200).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel deposit and release car (Staff/Admin)
// @route   PUT /api/deposits/:id/cancel
// @access  Private/Staff
exports.cancelDeposit = async (req, res) => {
  try {
    let deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn đặt cọc.' });
    }

    const oldData = deposit.toObject();

    deposit.status = 'cancelled';
    deposit.handledBy = req.user.id;
    await deposit.save();

    // Release the car back to available
    await Car.findByIdAndUpdate(deposit.car, { status: 'available' });

    // Write audit log
    await createAuditLog(req.user._id, 'CANCEL_DEPOSIT', 'Deposit', deposit._id, oldData, deposit.toObject(), req);

    res.status(200).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Refund deposit and release car (Admin only)
// @route   PUT /api/deposits/:id/refund
// @access  Private/Admin
exports.refundDeposit = async (req, res) => {
  try {
    let deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn đặt cọc.' });
    }

    const oldData = deposit.toObject();

    deposit.status = 'refunded';
    deposit.handledBy = req.user.id;
    await deposit.save();

    // Release car
    await Car.findByIdAndUpdate(deposit.car, { status: 'available' });

    // Write audit log
    await createAuditLog(req.user._id, 'REFUND_DEPOSIT', 'Deposit', deposit._id, oldData, deposit.toObject(), req);

    res.status(200).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Convert Deposit to Order contract (Staff/Admin)
// @route   PUT /api/deposits/:id/convert-to-order
// @access  Private/Staff
exports.convertToOrder = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('car');

    if (!deposit) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đặt cọc.' });
    }

    if (deposit.status !== 'confirmed') {
      return res.status(400).json({ message: 'Chỉ có thể chuyển đổi đặt cọc đã được xác nhận thành đơn hàng.' });
    }

    const car = deposit.car;
    const orderCode = generateOrderCode('ORD');
    const carPrice = car.price;
    const depositAmount = deposit.depositAmount;
    const remainingAmount = carPrice - depositAmount;

    // Create the Order
    const order = await Order.create({
      orderCode,
      user: deposit.user,
      car: car._id,
      deposit: deposit._id,
      customerInfo: {
        fullName: deposit.customerInfo.fullName,
        phone: deposit.customerInfo.phone,
        email: deposit.customerInfo.email,
        address: req.body.address || 'Đang cập nhật', // Address is required for orders
        note: deposit.customerInfo.note
      },
      carInfo: {
        code: car.code,
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        price: car.price
      },
      carPrice,
      depositAmount,
      remainingAmount,
      total: carPrice,
      paymentMethod: req.body.paymentMethod || 'bank_transfer',
      paymentStatus: 'deposit_paid',
      orderStatus: 'deposited',
      assignedStaff: req.user.id
    });

    // Update deposit status
    deposit.status = 'converted_to_order';
    await deposit.save();

    // Create Audit Log
    await createAuditLog(req.user._id, 'CONVERT_DEPOSIT_TO_ORDER', 'Deposit', deposit._id, { status: 'confirmed' }, { status: 'converted_to_order' }, req);

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
