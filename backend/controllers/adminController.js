const { z } = require('zod');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, paginate, pageMeta, platformFee } = require('../utils/helpers');
const { populateOrder } = require('../utils/populate');
const { notify } = require('../utils/notify');
const { series } = require('../utils/stats');

exports.userStatusSchema = z.object({ status: z.enum(['active', 'rejected', 'blocked', 'pending']) });
exports.sendNotificationSchema = z
  .object({
    target: z.enum(['all', 'farmers', 'clients', 'user']),
    userId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    title: z.string().trim().min(2).max(100),
    message: z.string().trim().min(2).max(500),
  })
  .refine((d) => d.target !== 'user' || d.userId, { message: 'userId is required', path: ['userId'] });

// ---------- dashboard ----------
exports.dashboard = asyncHandler(async (_req, res) => {
  const [farmers, clients, products, orders, pending, completed, revenueAgg, recentUsers, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'client' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    Order.countDocuments({ status: 'Delivered' }),
    Order.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    User.find({ role: { $ne: 'admin' } }).sort('-createdAt').limit(6).select('name email role status createdAt'),
    populateOrder(Order.find().sort('-orderDate').limit(6)),
  ]);
  const [monthlyOrders, monthlyRevenue, farmerRegs, clientRegs, productSales] = await Promise.all([
    series(Order, {}, 'orderDate', 1, 6),
    series(Order, { status: 'Delivered' }, 'orderDate', '$totalAmount', 6),
    series(User, { role: 'farmer' }, 'createdAt', 1, 6),
    series(User, { role: 'client' }, 'createdAt', 1, 6),
    Order.aggregate([
      { $match: { status: { $nin: ['Rejected', 'Cancelled'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } },
      { $sort: { qty: -1 } },
      { $limit: 6 },
    ]),
  ]);
  res.json({
    success: true,
    data: {
      cards: { farmers, clients, products, orders, pending, completed, revenue: revenueAgg[0]?.t || 0 },
      charts: {
        monthlyOrders,
        monthlyRevenue,
        farmerRegs,
        clientRegs,
        productSales: productSales.map((p) => ({ label: p._id, value: p.qty })),
      },
      recentUsers,
      recentOrders,
    },
  });
});

// ---------- farmers ----------
exports.farmers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = { role: 'farmer' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total, counts] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
    User.aggregate([{ $match: { role: 'farmer' } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const profiles = await Farmer.find({ user: { $in: users.map((u) => u._id) } });
  const map = new Map(profiles.map((p) => [String(p.user), p]));
  const data = users
    .map((u) => (map.get(String(u._id)) ? { ...map.get(String(u._id)).toObject(), user: u } : null))
    .filter(Boolean);
  res.json({
    success: true,
    data,
    pagination: pageMeta(page, limit, total),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  });
});

exports.setFarmerStatus = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id);
  if (!farmer) throw new AppError('Farmer not found', 404);
  const user = await User.findByIdAndUpdate(farmer.user, { status: req.body.status }, { new: true });
  const msgs = {
    active: 'Your farmer account is active. You can now add products.',
    rejected: 'Your farmer registration was rejected.',
    blocked: 'Your account has been blocked by the admin.',
    pending: 'Your account is under review.',
  };
  await notify(user._id, 'Account update', msgs[req.body.status], 'account');
  res.json({ success: true, data: { ...farmer.toObject(), user } });
});

// ---------- clients ----------
exports.clients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = { role: 'client' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const profiles = await Client.find({ user: { $in: users.map((u) => u._id) } });
  const stats = await Order.aggregate([
    { $match: { client: { $in: profiles.map((p) => p._id) } } },
    { $group: { _id: '$client', orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalAmount', 0] } } } },
  ]);
  const sMap = new Map(stats.map((s) => [String(s._id), s]));
  const pMap = new Map(profiles.map((p) => [String(p.user), p]));
  const data = users
    .filter((u) => pMap.get(String(u._id)))
    .map((u) => {
      const p = pMap.get(String(u._id));
      const s = sMap.get(String(p._id));
      return { _id: p._id, user: u, orders: s?.orders || 0, spent: s?.spent || 0 };
    });
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.setClientStatus = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new AppError('Client not found', 404);
  const status = req.body.status === 'blocked' ? 'blocked' : 'active';
  const user = await User.findByIdAndUpdate(client.user, { status }, { new: true });
  res.json({ success: true, data: { _id: client._id, user } });
});

// ---------- payments ----------
exports.payments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.method = req.query.method;
  const [data, total, totals] = await Promise.all([
    Payment.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderId status')
      .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'farmer', select: 'farmName' }),
    Payment.countDocuments(filter),
    Payment.aggregate([{ $group: { _id: '$status', t: { $sum: '$amount' } } }]),
  ]);
  res.json({
    success: true,
    data,
    pagination: pageMeta(page, limit, total),
    totals: Object.fromEntries(totals.map((t) => [t._id, t.t])),
  });
});

// ---------- notifications ----------
exports.sendNotification = asyncHandler(async (req, res) => {
  const { target, userId, title, message } = req.body;
  let ids;
  if (target === 'user') ids = [userId];
  else if (target === 'all') ids = await User.find({ role: { $ne: 'admin' }, status: 'active' }).distinct('_id');
  else ids = await User.find({ role: target === 'farmers' ? 'farmer' : 'client', status: 'active' }).distinct('_id');
  if (!ids.length) throw new AppError('No recipients found', 400);
  await Notification.insertMany(ids.map((user) => ({ user, title, message, type: 'system' })));
  res.status(201).json({ success: true, message: `Notification sent to ${ids.length} user(s)` });
});

// ---------- reports ----------
exports.reports = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.orderDate = {};
    if (req.query.from) match.orderDate.$gte = new Date(req.query.from);
    if (req.query.to) match.orderDate.$lte = new Date(new Date(req.query.to).getTime() + 864e5 - 1);
  }
  const delivered = { ...match, status: 'Delivered' };
  const fee = platformFee();

  const [totals, byStatus, byCategory, topFarmers, monthlyRevenue, byPayment] = await Promise.all([
    Order.aggregate([{ $match: delivered }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: delivered },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$c.name', 'Other'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          qty: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: delivered },
      { $group: { _id: '$farmer', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'f' } },
      { $unwind: '$f' },
      { $project: { _id: 1, revenue: 1, orders: 1, farmName: '$f.farmName' } },
    ]),
    series(Order, { status: 'Delivered' }, 'orderDate', '$totalAmount', 12),
    Order.aggregate([{ $match: delivered }, { $group: { _id: '$paymentMethod', t: { $sum: '$totalAmount' }, n: { $sum: 1 } } }]),
  ]);
  const revenue = totals[0]?.revenue || 0;
  res.json({
    success: true,
    data: {
      summary: {
        revenue,
        completedOrders: totals[0]?.orders || 0,
        avgOrderValue: totals[0]?.orders ? Math.round(revenue / totals[0].orders) : 0,
        feePercent: fee,
        commission: Math.round(revenue * fee) / 100,
      },
      byStatus: byStatus.map((s) => ({ label: s._id, value: s.n })),
      byCategory: byCategory.map((c) => ({ label: c._id, value: c.revenue, qty: c.qty })),
      topFarmers,
      monthlyRevenue,
      byPayment: byPayment.map((p) => ({ label: p._id, value: p.t, orders: p.n })),
    },
  });
});

// ---------- system activity ----------
exports.activity = asyncHandler(async (_req, res) => {
  const [users, orders, products, reviews, complaints] = await Promise.all([
    User.find({ role: { $ne: 'admin' } }).sort('-createdAt').limit(8).select('name role createdAt'),
    Order.find().sort('-createdAt').limit(8).select('orderId status totalAmount createdAt'),
    Product.find().sort('-createdAt').limit(8).select('name status createdAt'),
    Review.find().sort('-createdAt').limit(5).select('rating createdAt').populate('product', 'name'),
    Complaint.find().sort('-createdAt').limit(5).select('subject status createdAt'),
  ]);
  const events = [
    ...users.map((u) => ({ type: 'user', text: `${u.name} registered as ${u.role}`, at: u.createdAt })),
    ...orders.map((o) => ({ type: 'order', text: `Order ${o.orderId} placed (₹${o.totalAmount}) — ${o.status}`, at: o.createdAt })),
    ...products.map((p) => ({ type: 'product', text: `Product "${p.name}" listed — ${p.status}`, at: p.createdAt })),
    ...reviews.map((r) => ({ type: 'review', text: `${r.rating}★ review on ${r.product?.name || 'a product'}`, at: r.createdAt })),
    ...complaints.map((c) => ({ type: 'complaint', text: `Complaint: ${c.subject} (${c.status})`, at: c.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);
  res.json({ success: true, data: events });
});
