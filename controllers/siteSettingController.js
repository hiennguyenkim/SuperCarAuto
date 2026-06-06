const SiteSetting = require('../models/SiteSetting');
const deleteFile = require('../utils/deleteFile');

// @desc    Get site settings configuration
// @route   GET /api/site-settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    let settings = await SiteSetting.findOne()
      .populate('featuredCars')
      .populate('featuredCollections.collections');

    if (!settings) {
      // Build default configuration if none exists
      settings = await SiteSetting.create({
        hero: {
          title: 'Sở hữu siêu xe mơ ước của bạn',
          subtitle: 'SuperCar Luxury',
          description: 'Hệ thống showroom siêu xe và xe thể thao cao cấp, minh bạch pháp lý và hỗ trợ lái thử.',
          buttonText: 'Khám Phá Ngay',
          buttonLink: '/views/cars.html',
          image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80',
          isVisible: true
        },
        featuredCars: [],
        featuredCollections: {
          title: 'Bộ Sưu Tập Độc Quyền',
          subtitle: 'Tuyển chọn theo từng phong cách và cá tính riêng biệt',
          collections: [],
          isVisible: true
        },
        aboutSection: {
          title: 'Về SuperCar Luxury',
          subtitle: 'Đẳng Cấp Thượng Lưu',
          description: 'Chúng tôi tự hào là đơn vị phân phối siêu xe chính hãng hàng đầu tại Việt Nam, mang đến trải nghiệm lái xe trọn vẹn và an tâm tuyệt đối.',
          image: 'https://images.unsplash.com/photo-1562591176-b2b2b80155b4?auto=format&fit=crop&w=800&q=80',
          isVisible: true
        },
        bankInfo: {
          bankName: 'Techcombank (TCB)',
          accountNumber: '1903548888888',
          accountHolder: 'CONG TY CO PHAN SUPERCAR LUXURY VIET NAM',
          qrCode: ''
        },
        contactInfo: {
          phone: '1900 8888',
          email: 'info@supercarluxury.vn',
          address: '88 Lê Văn Lương, Thanh Xuân, Hà Nội'
        },
        socialLinks: {
          zalo: '',
          facebook: '',
          tiktok: '',
          instagram: ''
        }
      });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update whole settings object (Admin)
// @route   PUT /api/site-settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create(req.body);
    } else {
      settings = await SiteSetting.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update hero section configurations (Admin)
// @route   POST /api/site-settings/banner
// @access  Private/Admin
exports.updateHeroBanner = async (req, res) => {
  try {
    const { title, subtitle, description, buttonText, buttonLink, isVisible } = req.body;
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create({});
    }

    let image = settings.hero ? settings.hero.image : '';
    if (req.file) {
      if (settings.hero && settings.hero.image) {
        deleteFile(settings.hero.image);
      }
      image = `/public/uploads/banners/${req.file.filename}`;
    }

    settings.hero = {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      image,
      isVisible: isVisible === 'true'
    };

    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update homepage featured cars list (Admin)
// @route   PUT /api/site-settings/featured-cars
// @access  Private/Admin
exports.updateFeaturedCars = async (req, res) => {
  try {
    const { cars } = req.body;
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create({});
    }

    let carsList = [];
    if (cars) {
      carsList = typeof cars === 'string' ? JSON.parse(cars) : cars;
    }

    settings.featuredCars = carsList;

    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update homepage featured collections list (Admin)
// @route   PUT /api/site-settings/featured-collections
// @access  Private/Admin
exports.updateFeaturedCollections = async (req, res) => {
  try {
    const { title, subtitle, collections, isVisible } = req.body;
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create({});
    }

    let collectionsList = [];
    if (collections) {
      collectionsList = typeof collections === 'string' ? JSON.parse(collections) : collections;
    }

    settings.featuredCollections = {
      title,
      subtitle,
      collections: collectionsList,
      isVisible: isVisible === 'true'
    };

    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload site logo (Admin)
// @route   POST /api/site-settings/upload-logo
// @access  Private/Admin
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file logo!' });
    }
    const url = `/public/uploads/others/${req.file.filename}`;
    res.status(200).json({ success: true, url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload homepage banner image (Admin)
// @route   POST /api/site-settings/upload-banner
// @access  Private/Admin
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file banner!' });
    }
    const url = `/public/uploads/banners/${req.file.filename}`;
    res.status(200).json({ success: true, url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload bank QR code image (Admin)
// @route   POST /api/site-settings/upload-qr
// @access  Private/Admin
exports.uploadQr = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file QR!' });
    }
    const url = `/public/uploads/others/${req.file.filename}`;
    res.status(200).json({ success: true, url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

