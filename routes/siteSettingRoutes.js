const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  updateHeroBanner,
  updateFeaturedCars,
  updateFeaturedCollections,
  uploadLogo,
  uploadBanner,
  uploadQr
} = require('../controllers/siteSettingController');
const { requireAuth, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getSettings)
  .put(requireAuth, requireAdmin, updateSettings);

router.post('/banner', requireAuth, requireAdmin, upload.single('banner'), updateHeroBanner);
router.put('/featured-cars', requireAuth, requireAdmin, updateFeaturedCars);
router.put('/featured-collections', requireAuth, requireAdmin, updateFeaturedCollections);

router.post('/upload-logo', requireAuth, requireAdmin, upload.single('logo'), uploadLogo);
router.post('/upload-banner', requireAuth, requireAdmin, upload.single('banner'), uploadBanner);
router.post('/upload-qr', requireAuth, requireAdmin, upload.single('qr'), uploadQr);

module.exports = router;

