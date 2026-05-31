const FinanceRequest = require('../models/FinanceRequest');
const Car = require('../models/Car');

// @desc    Create installment loan application
// @route   POST /api/finance-requests
// @access  Private
exports.createFinanceRequest = async (req, res) => {
  try {
    const { carId, fullName, phone, email, downPayment, loanTerm, monthlyIncome, preferredBank, note } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe.' });
    }

    const carPrice = car.price;
    const parsedDownPayment = Number(downPayment) || 0;
    const loanAmount = carPrice - parsedDownPayment;

    // Approximate monthly payment based on 8% standard annual interest rate
    const annualInterestRate = 0.08;
    const totalInterest = loanAmount * annualInterestRate * (Number(loanTerm) / 12);
    const expectedMonthlyPayment = Math.round((loanAmount + totalInterest) / Number(loanTerm));

    const request = await FinanceRequest.create({
      user: req.user.id,
      car: carId,
      fullName,
      phone,
      email,
      carPrice,
      downPayment: parsedDownPayment,
      loanAmount,
      loanTerm,
      expectedMonthlyPayment,
      monthlyIncome: Number(monthlyIncome) || 0,
      preferredBank,
      note
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all installment requests (Staff/Admin)
// @route   GET /api/finance-requests
// @access  Private/Staff
exports.getFinanceRequests = async (req, res) => {
  try {
    const requests = await FinanceRequest.find()
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's loan applications
// @route   GET /api/finance-requests/my-requests
// @access  Private
exports.getMyFinanceRequests = async (req, res) => {
  try {
    const requests = await FinanceRequest.find({ user: req.user.id })
      .populate('car')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single finance request details
// @route   GET /api/finance-requests/:id
// @access  Private
exports.getFinanceRequest = async (req, res) => {
  try {
    const request = await FinanceRequest.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('car')
      .populate('assignedStaff', 'fullName email');

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu trả góp.' });
    }

    if (request.user && request.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Quyền xem chi tiết bị từ chối.' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update finance request status
// @route   PUT /api/finance-requests/:id/status
// @access  Private/Staff
exports.updateFinanceRequestStatus = async (req, res) => {
  try {
    const { status, staffNote } = req.body;
    let request = await FinanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu trả góp.' });
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
