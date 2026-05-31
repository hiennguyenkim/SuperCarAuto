const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'public/uploads/';
    // Route files to specific uploads folder
    if (file.fieldname === 'car' || file.fieldname === 'cars' || req.originalUrl.includes('/cars')) {
      dir += 'cars/';
    } else if (file.fieldname === 'brand' || req.originalUrl.includes('/brands')) {
      dir += 'brands/';
    } else if (file.fieldname === 'category' || req.originalUrl.includes('/categories')) {
      dir += 'categories/';
    } else if (file.fieldname === 'collection' || req.originalUrl.includes('/collections')) {
      dir += 'collections/';
    } else if (file.fieldname === 'banner' || req.originalUrl.includes('/banners')) {
      dir += 'banners/';
    } else if (file.fieldname === 'licenseImage' || file.fieldname === 'license') {
      dir += 'licenses/';
    } else if (file.fieldname === 'paymentProof' || file.fieldname === 'proof') {
      dir += 'proofs/';
    } else {
      dir += 'others/';
    }

    // Double check that folder directory exists, create recursively if not
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf/;
  const extnameTest = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetypeTest = allowedExtensions.test(file.mimetype);

  if (extnameTest && mimetypeTest) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các định dạng tệp ảnh (jpg, jpeg, png, gif, webp) hoặc pdf!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximum file size
  fileFilter
});

module.exports = upload;
