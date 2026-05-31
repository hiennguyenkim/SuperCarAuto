const Appointment = require('../models/Appointment');
const Car = require('../models/Car');

// @desc    Create appointment (view car in showroom)
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const { carId, customerInfo, showroom, appointmentDate, appointmentTime, groupSize } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin xe cần hẹn xem.' });
    }

    if (car.status === 'sold' || car.status === 'hidden') {
      return res.status(400).json({ message: 'Xe này không còn sẵn sàng để xem tại showroom.' });
    }

    const appointment = await Appointment.create({
      user: req.user.id,
      car: carId,
      customerInfo,
      showroom: showroom || car.showroom,
      appointmentDate,
      appointmentTime,
      groupSize: groupSize || 1
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all appointments (Staff/Admin)
// @route   GET /api/appointments
// @access  Private/Staff
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id })
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email');

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
    }

    // Allow access only to owner or staff/admin
    if (appointment.user && appointment.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Bạn không có quyền xem thông tin lịch hẹn của người khác.' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Staff
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, staffNote, assignedStaff } = req.body;
    const validStatuses = ['pending','confirmed','contacted','visited','completed','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ: ' + status });
    }
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, staffNote, assignedStaff, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// @desc    Assign staff to appointment
// @route   PUT /api/appointments/:id/assign-staff
// @access  Private/Admin
exports.assignStaff = async (req, res) => {
  try {
    const { assignedStaff } = req.body;
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
    }

    appointment.assignedStaff = assignedStaff;
    await appointment.save();

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private/Staff
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa lịch hẹn thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
