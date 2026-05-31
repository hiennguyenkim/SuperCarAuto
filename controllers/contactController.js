const ContactMessage = require('../models/ContactMessage');

// @desc    Create contact message
// @route   POST /api/contact-message
// @access  Public
exports.createContactMessage = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message, relatedCar } = req.body;
    const msg = await ContactMessage.create({
      fullName,
      email,
      phone,
      subject,
      message,
      relatedCar: relatedCar || undefined
    });
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all contact messages (Staff/Admin)
// @route   GET /api/contact-message
// @access  Private/Staff
exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate('relatedCar', 'name code slug')
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update contact message status
// @route   PUT /api/contact-message/:id/status
// @access  Private/Staff
exports.updateStatus = async (req, res) => {
  try {
    const { status, staffNote, assignedStaff } = req.body;
    let message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn liên hệ.' });
    }

    message.status = status;
    if (staffNote !== undefined) {
      message.staffNote = staffNote;
    }
    if (assignedStaff !== undefined) {
      message.assignedStaff = assignedStaff;
    }

    await message.save();
    res.status(200).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact-message/:id
// @access  Private/Staff
exports.deleteContactMessage = async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn liên hệ.' });
    }

    await ContactMessage.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa tin nhắn thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
