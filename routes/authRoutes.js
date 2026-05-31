const express = require('express');
const router = express.Router();
const { register, login, logout, me, changePassword, forgotPassword, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.put('/change-password', requireAuth, changePassword);
router.put('/update-profile', requireAuth, updateProfile);
router.post('/forgot-password', forgotPassword);

module.exports = router;
