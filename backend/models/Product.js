const mongoose = require('mongoose');
const { PRODUCT_STATUS, UNITS } = require('../utils/constants');

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    images: [{ url: { type: String, required: true }, publicId: String }],
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: UNITS, default: 'kg' },
    location: { type: String, required: true, trim: true },
    harvestDate: { type: Date, required: true },
    status: { type: String, enum: PRODUCT_STATUS, default: 'Pending', index: true },
    rejectionReason: String,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    // NEW: Google Maps link of the farm / pickup point (optional)
    mapLink: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', location: 'text' });

productSchema.pre('validate', function (next) {
  if (!this.productId) {
    this.productId = 'PRD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);