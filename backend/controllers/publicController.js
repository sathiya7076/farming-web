const { z } = require('zod');
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Complaint = require('../models/Complaint');
const asyncHandler = require('../utils/asyncHandler');
const { PUBLIC_PRODUCT_STATUS: PUBLIC } = require('../utils/constants');
const { activeFarmerIds } = require('../utils/helpers');
const { notifyMany } = require('../utils/notify');

exports.contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
});

exports.home = asyncHandler(async (_req, res) => {
  const ids = await activeFarmerIds();
  const pf = { status: { $in: PUBLIC }, farmer: { $in: ids } };

  const [categories, counts, featuredProducts, featuredFarmers, reviews, clients, products, delivered] = await Promise.all([
    Category.find({ isActive: true }).sort('name').lean(),
    Product.aggregate([{ $match: pf }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    Product.find(pf)
      .sort({ featured: -1, ratingAvg: -1, createdAt: -1 })
      .limit(8)
      .populate('category', 'name slug')
      .populate({ path: 'farmer', select: 'farmName location user', populate: { path: 'user', select: 'name' } }),
    Farmer.find({ _id: { $in: ids } }).sort({ featured: -1, ratingAvg: -1 }).limit(4).populate('user', 'name'),
    Review.find({ isVisible: true, rating: { $gte: 4 }, comment: { $exists: true, $ne: '' } })
      .sort('-createdAt')
      .limit(6)
      .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'name' } })
      .populate('product', 'name'),
    User.countDocuments({ role: 'client', status: 'active' }),
    Product.countDocuments(pf),
    Order.countDocuments({ status: 'Delivered' }),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    success: true,
    data: {
      categories: categories.map((c) => ({ ...c, count: map.get(String(c._id)) || 0 })),
      featuredProducts,
      featuredFarmers,
      reviews,
      stats: { farmers: ids.length, clients, products, delivered },
    },
  });
});

exports.contact = asyncHandler(async (req, res) => {
  const c = await Complaint.create(req.body);
  const admins = await User.find({ role: 'admin' }).distinct('_id');
  await notifyMany(admins, 'New contact message', `${req.body.name}: ${req.body.subject}`, 'system', '/admin/complaints');
  res.status(201).json({ success: true, message: 'Thanks! We have received your message.', data: { id: c._id } });
});
