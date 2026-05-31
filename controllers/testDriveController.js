const TestDrive = require('../models/TestDrive');
const Car = require('../models/Car');
const deleteFile = require('../utils/deleteFile');

// @desc    Create test drive request
// @route   POST /api/test-drives
// @access  Private
exports.createTestDrive = async (req, res) => {
  try {
    const { carId, customerInfo, showroom, testDriveDate, testDriveTime, drivingExperience } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe.' });
    }

    // Validate: must support test driving
    if (!car.allowTestDrive) {
      return res.status(400).json({ message: 'Dòng xe này không hỗ trợ chương trình lái thử.' });
    }

    // Validate: must be available
    if (car.status !== 'available') {
      return res.status(400).json({ message: 'Không thể đăng ký lái thử xe đã được đặt cọc hoặc đã bán.' });
    }

    let licenseImage = '';
    if (req.file) {
      licenseImage = `/public/uploads/licenses/${req.file.filename}`;
    }

    let parsedCustomerInfo = customerInfo;
    if (customerInfo && typeof customerInfo === 'string') {
      try {
        parsedCustomerInfo = JSON.parse(customerInfo);
      } catch (e) {
        // Fallback if form-data didn't pass nested JSON object directly
        return res.status(400).json({ message: 'Thông tin khách hàng không hợp lệ.' });
      }
    }

    const testDrive = await TestDrive.create({
      user: req.user.id,
      car: carId,
      customerInfo: parsedCustomerInfo,
      showroom: showroom || car.showroom,
      testDriveDate,
      testDriveTime,
      drivingExperience,
      licenseImage
    });

    res.status(201).json({ success: true, data: testDrive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all test drives (Staff/Admin)
// @route   GET /api/test-drives
// @access  Private/Staff
exports.getTestDrives = async (req, res) => {
  try {
    const testDrives = await TestDrive.find()
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: testDrives.length, data: testDrives });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get current user's test drives
// @route   GET /api/test-drives/my-test-drives
// @access  Private
exports.getMyTestDrives = async (req, res) => {
  try {
    const testDrives = await TestDrive.find({ user: req.user.id })
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: testDrives.length, data: testDrives });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single test drive details
// @route   GET /api/test-drives/:id
// @access  Private
exports.getTestDrive = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate({ path: 'car', populate: 'brand' })
      .populate('assignedStaff', 'fullName email');

    if (!testDrive) {
      return res.status(404).json({ message: 'Không tìm thấy lịch lái thử.' });
    }

    if (testDrive.user && testDrive.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Quyền xem chi tiết bị từ chối.' });
    }

    res.status(200).json({ success: true, data: testDrive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update test drive status
// @route   PUT /api/test-drives/:id/status
// @access  Private/Staff
exports.updateTestDriveStatus = async (req, res) => {
  try {
    const { status, staffNote, assignedStaff } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ: ' + status });
    }
    const updated = await TestDrive.findByIdAndUpdate(
      req.params.id,
      { status, staffNote, assignedStaff, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy lịch lái thử' });
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// @desc    Assign staff to test drive
// @route   PUT /api/test-drives/:id/assign-staff
// @access  Private/Admin
exports.assignStaff = async (req, res) => {
  try {
    const { assignedStaff } = req.body;
    let testDrive = await TestDrive.findById(req.params.id);

    if (!testDrive) {
      return res.status(404).json({ message: 'Không tìm thấy lịch lái thử.' });
    }

    testDrive.assignedStaff = assignedStaff;
    await testDrive.save();

    res.status(200).json({ success: true, data: testDrive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete test drive
// @route   DELETE /api/test-drives/:id
// @access  Private/Staff
exports.deleteTestDrive = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id);

    if (!testDrive) {
      return res.status(404).json({ message: 'Không tìm thấy lịch lái thử.' });
    }

    deleteFile(testDrive.licenseImage);
    await TestDrive.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Đã xóa lịch lái thử thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
