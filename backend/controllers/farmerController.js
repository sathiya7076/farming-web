const { z } = require('zod');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { PUBLIC_PRODUCT_STATUS: PUBLIC } = require('../utils/constants');
const { escapeRegex, paginate, pageMeta, activeFarmerIds, farmerOf, platformFee } = require('../utils/helpers');
const { populateOrder } = require('../utils/populate');
const { series } = require('../utils/stats');

exports.updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  farmName: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2).optional(),
  bio: z.string().trim().max(1000).optional(),
  farmSize: z.string().trim().max(60).optional(),
  experienceYears: z.coerce.number().min(0).max(80).optional(),
  specialties: z.array(z.string().trim()).optional(),
  featured: z.boolean().optional(), // admin only (enforced below)
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 12);
  const ids = await activeFarmerIds();
  const filter = { _id: { $in: ids } };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ farmName: rx }, { location: rx }];
  }
  if (req.query.location) filter.location = new RegExp(escapeRegex(req.query.location), 'i');

  const [farmers, total] = await Promise.all([
    Farmer.find(filter).sort({ featured: -1, ratingAvg: -1 }).skip(skip).limit(limit).populate('user', 'name'),
    Farmer.countDocuments(filter),
  ]);
  const counts = await Product.aggregate([
    { $match: { farmer: { $in: farmers.map((f) => f._id) }, status: { $in: PUBLIC } } },
    { $group: { _id: '$farmer', n: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  const data = farmers.map((f) => ({ ...f.toObject(), productCount: map.get(String(f._id)) || 0 }));
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id).populate('user', 'name status');
  if (!farmer || farmer.user.status !== 'active') throw new AppError('Farmer not found', 404);
  const [products, reviews] = await Promise.all([
    Product.find({ farmer: farmer._id, status: { $in: PUBLIC } }).populate('category', 'name').sort('-createdAt').limit(12),
    Review.find({ farmer: farmer._id, isVisible: true })
      .sort('-createdAt')
      .limit(10)
      .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'name' } })
      .populate('product', 'name'),
  ]);
  res.json({ success: true, data: { farmer, products, reviews } });
});

// Farmer edits own profile; admin can edit any farmer (and toggle `featured`).
exports.update = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id);
  if (!farmer) throw new AppError('Farmer not found', 404);
  if (req.user.role !== 'admin' && String(farmer.user) !== String(req.user._id)) {
    throw new AppError('You can only edit your own profile', 403);
  }
  const { name, phone, featured, ...profile } = req.body;
  if (featured !== undefined && req.user.role === 'admin') farmer.featured = featured;
  Object.assign(farmer, profile);
  await farmer.save();
  const userUpdate = {};
  if (name) userUpdate.name = name;
  if (phone !== undefined) userUpdate.phone = phone;
  if (Object.keys(userUpdate).length) await User.updateOne({ _id: farmer.user }, userUpdate);
  res.json({ success: true, data: await Farmer.findById(farmer._id).populate('user', 'name email phone status') });
});

exports.dashboard = asyncHandler(async (req, res) => {
  const farmer = await farmerOf(req.user);
  const fid = farmer._id;
  const fee = platformFee();
  const net = (x) => Math.round(x * (100 - fee)) / 100;

  const [totalProducts, activeProducts, totalOrders, completedOrders, salesAgg, recentOrders, monthlySales, monthlyOrders] =
    await Promise.all([
      Product.countDocuments({ farmer: fid }),
      Product.countDocuments({ farmer: fid, status: { $in: PUBLIC } }),
      Order.countDocuments({ farmer: fid }),
      Order.countDocuments({ farmer: fid, status: 'Delivered' }),
      Order.aggregate([{ $match: { farmer: fid, status: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      populateOrder(Order.find({ farmer: fid }).sort('-orderDate').limit(5)),
      series(Order, { farmer: fid, status: 'Delivered' }, 'orderDate', '$totalAmount', 6),
      series(Order, { farmer: fid }, 'orderDate', 1, 6),
    ]);
  const totalSales = salesAgg[0]?.total || 0;
  res.json({
    success: true,
    data: {
      cards: { totalProducts, activeProducts, totalOrders, completedOrders, totalSales, totalEarnings: net(totalSales) },
      charts: {
        monthlySales,
        monthlyOrders,
        monthlyEarnings: monthlySales.map((m) => ({ label: m.label, value: net(m.value) })),
      },
      recentOrders,
    },
  });
});

exports.earnings = asyncHandler(async (req, res) => {
  const farmer = await farmerOf(req.user);
  const fid = farmer._id;
  const fee = platformFee();
  const net = (x) => Math.round(x * (100 - fee)) / 100;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [gross, pending, thisMonth, monthly, byProduct] = await Promise.all([
    Order.aggregate([{ $match: { farmer: fid, status: 'Delivered' } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      { $match: { farmer: fid, status: { $in: ['Accepted', 'Processing', 'Shipped'] } } },
      { $group: { _id: null, t: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { farmer: fid, status: 'Delivered', orderDate: { $gte: monthStart } } },
      { $group: { _id: null, t: { $sum: '$totalAmount' } } },
    ]),
    series(Order, { farmer: fid, status: 'Delivered' }, 'orderDate', '$totalAmount', 12),
    Order.aggregate([
      { $match: { farmer: fid, status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
  ]);
  const g = gross[0]?.t || 0;
  res.json({
    success: true,
    data: {
      feePercent: fee,
      gross: g,
      commission: Math.round((g - net(g)) * 100) / 100,
      net: net(g),
      pendingNet: net(pending[0]?.t || 0),
      thisMonthNet: net(thisMonth[0]?.t || 0),
      monthly: monthly.map((m) => ({ label: m.label, gross: m.value, net: net(m.value) })),
      byProduct,
    },
  });
});
