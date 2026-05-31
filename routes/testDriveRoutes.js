const express = require('express');
const router = express.Router();
const {
  createTestDrive,
  getTestDrives,
  getMyTestDrives,
  getTestDrive,
  updateTestDriveStatus,
  assignStaff,
  deleteTestDrive
} = require('../controllers/testDriveController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(requireAuth, upload.single('licenseImage'), createTestDrive)
  .get(requireAuth, requireStaff, getTestDrives);

router.get('/my-test-drives', requireAuth, getMyTestDrives);

router.route('/:id')
  .get(requireAuth, getTestDrive)
  .put(requireAuth, requireStaff, updateTestDriveStatus)
  .delete(requireAuth, requireStaff, deleteTestDrive);

router.put('/:id/status', requireAuth, requireStaff, updateTestDriveStatus);

router.put('/:id/assign-staff', requireAuth, requireAdmin, assignStaff);

module.exports = router;
