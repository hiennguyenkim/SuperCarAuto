const Coupon = require('../models/Coupon');
const calculateDiscount = require('../utils/calculateDiscount');

// @desc    Get all coupons (Staff/Admin)
// @route   GET /api/coupons
// @access  Private/Staff
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update coupon details
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }
    res.status(200).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa mã giảm giá thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Verify and apply coupon to transaction
// @route   POST /api/coupons/apply
// @access  Private
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderValue, carBrandName, carCategoryName } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(400).json({ message: 'Mã ưu đãi không hợp lệ hoặc đã hết hạn.' });
    }

    const discountAmount = calculateDiscount(coupon, Number(orderValue), carBrandName, carCategoryName);

    if (discountAmount === 0) {
      return res.status(400).json({ message: 'Mã ưu đãi không đáp ứng các điều kiện tối thiểu.' });
    }

    res.status(200).json({
      success: true,
      discountAmount,
      couponName: coupon.name,
      code: coupon.code
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
