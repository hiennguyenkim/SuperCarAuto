const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
  hero: {
    title: String,
    subtitle: String,
    description: String,
    image: String,
    buttonText: String,
    buttonLink: String,
    isVisible: { type: Boolean, default: true }
  },
  featuredCars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  featuredCollections: {
    title: String,
    subtitle: String,
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    isVisible: { type: Boolean, default: true }
  },
  aboutSection: {
    title: String,
    subtitle: String,
    description: String,
    image: String,
    isVisible: { type: Boolean, default: true }
  },
  logo: String,
  banners: [{
    title: String,
    subtitle: String,
    link: String,
    image: String,
    isActive: { type: Boolean, default: true }
  }],
  bankInfo: {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    qrCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  socialLinks: {
    zalo: String,
    facebook: String,
    tiktok: String,
    instagram: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
