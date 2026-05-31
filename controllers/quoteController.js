const QuoteRequest = require('../models/QuoteRequest');

// @desc    Create quote request
// @route   POST /api/quote-requests
// @access  Private
exports.createQuoteRequest = async (req, res) => {
  try {
    const { carId, fullName, phone, email, purchaseMethod, message } = req.body;
    const request = await QuoteRequest.create({
      user: req.user.id,
      car: carId,
      fullName,
      phone,
      email,
      purchaseMethod,
      message
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all quote requests (Staff/Admin)
// @route   GET /api/quote-requests
// @access  Private/Staff
exports.getQuoteRequests = async (req, res) => {
  try {
    const requests = await QuoteRequest.find()
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's quote requests
// @route   GET /api/quote-requests/my-requests
// @access  Private
exports.getMyQuoteRequests = async (req, res) => {
  try {
    const requests = await QuoteRequest.find({ user: req.user.id })
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single quote request details
// @route   GET /api/quote-requests/:id
// @access  Private
exports.getQuoteRequest = async (req, res) => {
  try {
    const request = await QuoteRequest.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email');

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu báo giá.' });
    }

    if (request.user && request.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Quyền xem bị từ chối.' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update quote request status
// @route   PUT /api/quote-requests/:id/status
// @access  Private/Staff
exports.updateQuoteRequestStatus = async (req, res) => {
  try {
    const { status, staffNote } = req.body;
    let request = await QuoteRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu báo giá.' });
    }

    request.status = status;
    if (staffNote !== undefined) {
      request.staffNote = staffNote;
    }

    await request.save();
    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
