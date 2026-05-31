const Car = require('../models/Car');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Collection = require('../models/Collection');
const generateSlug = require('../utils/generateSlug');
const deleteFile = require('../utils/deleteFile');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Get all cars with advanced filtering, sorting, pagination
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      brand,
      category,
      minPrice,
      maxPrice,
      condition,
      maxMileage,
      year,
      status,
      sort,
      search,
      page,
      limit
    } = req.query;

    const queryObj = { isActive: true };

    // Search query
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Brand filtering
    if (brand) {
      // brand query can be a slug or ObjectId
      const brandDoc = await Brand.findOne({ $or: [{ slug: brand }, { name: brand }] });
      if (brandDoc) {
        queryObj.brand = brandDoc._id;
      } else if (brand.match(/^[0-9a-fA-F]{24}$/)) {
        queryObj.brand = brand;
      } else {
        // If brand not found, return empty data
        return res.status(200).json({ success: true, count: 0, data: [], pagination: {} });
      }
    }

    // Category filtering
    if (category) {
      const catDoc = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
      if (catDoc) {
        queryObj.category = catDoc._id;
      } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
        queryObj.category = category;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [], pagination: {} });
      }
    }

    // Price filtering
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // Mileage filtering
    if (maxMileage) {
      queryObj.mileage = { $lte: Number(maxMileage) };
    }

    // Year filtering
    if (year) {
      queryObj.year = Number(year);
    }

    // Condition filtering
    if (condition) {
      queryObj.condition = condition;
    }

    // Status filtering
    if (status) {
      queryObj.status = status;
    } else {
      // By default, exclude hidden cars from public searches
      queryObj.status = { $ne: 'hidden' };
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default: newest
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortObj = { price: 1 };
          break;
        case 'price_desc':
          sortObj = { price: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        case 'oldest':
          sortObj = { createdAt: 1 };
          break;
        case 'mileage_asc':
          sortObj = { mileage: 1 };
          break;
        case 'horsepower_desc':
          sortObj = { horsepower: -1 };
          break;
        case 'view_desc':
          sortObj = { viewCount: -1 };
          break;
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skipNum = (pageNum - 1) * limitNum;

    const total = await Car.countDocuments(queryObj);
    const cars = await Car.find(queryObj)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .populate('collection', 'name slug')
      .sort(sortObj)
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: cars.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: cars
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('brand')
      .populate('category')
      .populate('collection');

    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single car by slug and increment view count atomically (incorporating User Feedback)
// @route   GET /api/cars/slug/:slug
// @access  Public
exports.getCarBySlug = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('brand')
      .populate('category')
      .populate('collection');

    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new car
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = async (req, res) => {
  try {
    const carData = { ...req.body };
    carData.slug = generateSlug(carData.name);

    // Multi-file upload path mapping
    if (req.files && req.files.length > 0) {
      carData.images = req.files.map(file => `/public/uploads/cars/${file.filename}`);
    } else if (carData.images && typeof carData.images === 'string') {
      carData.images = [carData.images]; // support simple URL string from form
    }

    // Format list fields if sent as JSON string
    const listFields = ['options', 'safetyFeatures', 'entertainmentFeatures', 'collection'];
    listFields.forEach(field => {
      if (carData[field] && typeof carData[field] === 'string') {
        try {
          carData[field] = JSON.parse(carData[field]);
        } catch (e) {
          // Fallback splits comma separated
          carData[field] = carData[field].split(',').map(s => s.trim());
        }
      }
    });

    const car = await Car.create(carData);

    // Write to audit log
    await createAuditLog(req.user._id, 'CREATE_CAR', 'Car', car._id, null, car.toObject(), req);

    res.status(201).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    const oldCarData = car.toObject();
    const updateData = { ...req.body };

    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    // Format list fields if sent as JSON string
    const listFields = ['options', 'safetyFeatures', 'entertainmentFeatures', 'collection', 'images'];
    listFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          updateData[field] = updateData[field].split(',').map(s => s.trim());
        }
      }
    });

    // Keep old images and append new if needed, or replace if explicitly defined
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/public/uploads/cars/${file.filename}`);
      if (updateData.replaceImages === 'true') {
        // delete old images
        car.images.forEach(img => deleteFile(img));
        updateData.images = newImages;
      } else {
        const baseImages = Array.isArray(updateData.images) ? updateData.images : (car.images || []);
        updateData.images = [...baseImages, ...newImages];
      }
    }

    car = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    // Log the change
    await createAuditLog(req.user._id, 'UPDATE_CAR', 'Car', car._id, oldCarData, car.toObject(), req);

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    // Clear disk images
    if (car.images && car.images.length > 0) {
      car.images.forEach(img => deleteFile(img));
    }

    await Car.findByIdAndDelete(req.params.id);

    // Audit action
    await createAuditLog(req.user._id, 'DELETE_CAR', 'Car', car._id, car.toObject(), null, req);

    res.status(200).json({ success: true, message: 'Đã xóa xe thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update car status (Staff/Admin)
// @route   PUT /api/cars/:id/status
// @access  Private/Staff
exports.updateCarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    const oldCarData = car.toObject();

    car.status = status;
    await car.save();

    // Log the modification
    await createAuditLog(req.user._id, 'UPDATE_CAR_STATUS', 'Car', car._id, oldCarData, car.toObject(), req);

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update car featured status (Admin)
// @route   PUT /api/cars/:id/featured
// @access  Private/Admin
exports.updateCarFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    }

    car.isFeatured = isFeatured;
    await car.save();

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
