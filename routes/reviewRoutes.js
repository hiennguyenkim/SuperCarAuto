const express = require('express');
const router = express.Router();
const { getCarReviews, getMyReviews, createReview, updateVisibility, deleteReview, getAllReviews, replyReview } = require('../controllers/reviewController');
const { requireAuth, requireStaff } = require('../middleware/roleMiddleware');

router.get('/', requireAuth, requireStaff, getAllReviews);
router.get('/car/:carId', getCarReviews);
router.get('/my-reviews', requireAuth, getMyReviews);
router.post('/', requireAuth, createReview);

router.put('/:id/visibility', requireAuth, requireStaff, updateVisibility);
router.put('/:id/reply', requireAuth, requireStaff, replyReview);
router.delete('/:id', requireAuth, requireStaff, deleteReview);

module.exports = router;
