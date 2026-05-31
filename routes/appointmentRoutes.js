const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointment,
  updateAppointmentStatus,
  assignStaff,
  deleteAppointment
} = require('../controllers/appointmentController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .post(requireAuth, createAppointment)
  .get(requireAuth, requireStaff, getAppointments);

router.get('/my-appointments', requireAuth, getMyAppointments);

router.route('/:id')
  .get(requireAuth, getAppointment)
  .put(requireAuth, requireStaff, updateAppointmentStatus)
  .delete(requireAuth, requireStaff, deleteAppointment);

router.put('/:id/status', requireAuth, requireStaff, updateAppointmentStatus);

router.put('/:id/assign-staff', requireAuth, requireAdmin, assignStaff);

module.exports = router;
