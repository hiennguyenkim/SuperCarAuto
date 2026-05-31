const Order = require('../models/Order');
const Car = require('../models/Car');
const generateOrderCode = require('../utils/generateOrderCode');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Create manual order (Staff/Admin)
// @route   POST /api/orders
// @access  Private/Staff
exports.createOrder = async (req, res) => {
  try {
    const { carId, userId, customerInfo, paymentMethod, discountAmount } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe.' });
    }

    if (car.status === 'sold') {
      return res.status(400).json({ message: 'Xe này đã được bán thành công cho khách hàng khác.' });
    }

    if (car.status === 'reserved' && req.user.role === 'user') {
      return res.status(400).json({ message: 'Xe này hiện đã được đặt cọc giữ.' });
    }

    // Set car status to reserved upon order initiation
    car.status = 'reserved';
    await car.save();

    const orderCode = generateOrderCode('ORD');
    const carPrice = car.price;
    const depositAmount = car.depositAmount || 0;
    const discount = Number(discountAmount) || 0;
    const total = carPrice - discount;
    const remainingAmount = total - depositAmount;

    const order = await Order.create({
      orderCode,
      user: userId || req.user.id,
      car: carId,
      customerInfo,
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
      discountAmount: discount,
      total,
      paymentMethod,
      assignedStaff: req.user.id
    });

    // Write audit log
    await createAuditLog(req.user._id, 'CREATE_ORDER', 'Order', order._id, null, order.toObject(), req);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all orders (Staff/Admin)
// @route   GET /api/orders
// @access  Private/Staff
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    if (order.user && order.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Quyền truy cập thông tin đơn hàng bị từ chối.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update order general status (Staff/Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Staff
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, staffNote } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    const oldData = order.toObject();

    order.orderStatus = orderStatus;
    if (staffNote !== undefined) {
      order.staffNote = staffNote;
    }

    await order.save();

    // Log update
    await createAuditLog(req.user._id, 'UPDATE_ORDER_STATUS', 'Order', order._id, oldData, order.toObject(), req);

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Confirm order payments (Staff/Admin)
// @route   PUT /api/orders/:id/confirm-payment
// @access  Private/Staff
exports.confirmOrderPayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    const oldData = order.toObject();

    order.paymentStatus = paymentStatus;
    // Auto transition status if fully paid
    if (paymentStatus === 'paid') {
      order.orderStatus = 'paid';
    }
    await order.save();

    await createAuditLog(req.user._id, 'CONFIRM_ORDER_PAYMENT', 'Order', order._id, oldData, order.toObject(), req);

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Complete order / Handover car (Staff/Admin)
// @route   PUT /api/orders/:id/complete
// @access  Private/Staff
exports.completeOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    const oldData = order.toObject();

    order.orderStatus = 'completed';
    order.paymentStatus = 'paid';
    order.completedAt = new Date();
    await order.save();

    // Change vehicle status to SOLD
    await Car.findByIdAndUpdate(order.car, { status: 'sold' });

    // Write audit log
    await createAuditLog(req.user._id, 'COMPLETE_ORDER', 'Order', order._id, oldData, order.toObject(), req);

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel order (Staff/Admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private/Staff
exports.cancelOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    const oldData = order.toObject();

    order.orderStatus = 'cancelled';
    await order.save();

    // Release vehicle back to available
    await Car.findByIdAndUpdate(order.car, { status: 'available' });

    // Audit log
    await createAuditLog(req.user._id, 'CANCEL_ORDER', 'Order', order._id, oldData, order.toObject(), req);

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
