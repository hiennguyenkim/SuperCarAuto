const Review = require('../models/Review');

// @desc    Get reviews for a car
// @route   GET /api/reviews/car/:carId
// @access  Public
exports.getCarReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId, isVisible: true })
      .populate('user', 'fullName')
      .populate('staff', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('car', 'name images code slug')
      .populate('staff', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { carId, orderId, staffId, rating, comment } = req.body;

    if (orderId) {
      const alreadyReviewed = await Review.findOne({ user: req.user.id, order: orderId });
      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Bạn đã gửi đánh giá cho hợp đồng mua bán xe này rồi.' });
      }
    }

    const review = await Review.create({
      user: req.user.id,
      car: carId || undefined,
      order: orderId || undefined,
      staff: staffId || undefined,
      rating,
      comment
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update review visibility status (Staff/Admin)
// @route   PUT /api/reviews/:id/visibility
// @access  Private/Staff
exports.updateVisibility = async (req, res) => {
  try {
    const { isVisible } = req.body;
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá.' });
    }

    review.isVisible = isVisible;
    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete review (Staff/Admin)
// @route   DELETE /api/reviews/:id
// @access  Private/Staff
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá.' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa đánh giá khỏi hệ thống.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
