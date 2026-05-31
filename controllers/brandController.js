const Brand = require('../models/Brand');
const generateSlug = require('../utils/generateSlug');
const deleteFile = require('../utils/deleteFile');

// @desc    Get all active brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
  try {
    // Admin/staff sees inactive brands as well, but public gets active only
    const query = req.query.all === 'true' ? {} : { isActive: true };
    const brands = await Brand.find(query).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single brand by ID
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Không tìm thấy hãng xe này.' });
    }
    res.status(200).json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res) => {
  try {
    const { name, description, country, sortOrder } = req.body;
    const slug = generateSlug(name);

    let logo = '';
    if (req.file) {
      logo = `/public/uploads/brands/${req.file.filename}`;
    }

    const brand = await Brand.create({
      name,
      slug,
      logo,
      description,
      country,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res) => {
  try {
    const { name, description, country, sortOrder, isActive } = req.body;
    let brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: 'Không tìm thấy hãng xe này.' });
    }

    let logo = brand.logo;
    if (req.file) {
      deleteFile(brand.logo);
      logo = `/public/uploads/brands/${req.file.filename}`;
    }

    const updateFields = {
      description,
      country,
      sortOrder,
      isActive,
      logo
    };

    if (name) {
      updateFields.name = name;
      updateFields.slug = generateSlug(name);
    }

    brand = await Brand.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: 'Không tìm thấy hãng xe này.' });
    }

    // Clean up uploaded files
    deleteFile(brand.logo);

    await Brand.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa thương hiệu xe thành công.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
