const { z } = require('zod');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, pageMeta } = require('../utils/helpers');
const { notify, notifyMany } = require('../utils/notify');

exports.createSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
  orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});
exports.updateSchema = z.object({
  status: z.enum(['Open', 'In Review', 'Resolved']).optional(),
  adminResponse: z.string().trim().max(2000).optional(),
});

exports.create = asyncHandler(async (req, res) => {
  const { subject, message, orderId } = req.body;
  const c = await Complaint.create({ user: req.user._id, name: req.user.name, email: req.user.email, subject, message, order: orderId });
  const admins = await User.find({ role: 'admin' }).distinct('_id');
  await notifyMany(admins, 'New complaint', `${req.user.name}: ${subject}`, 'system', '/admin/complaints');
  res.status(201).json({ success: true, data: c });
});

exports.mine = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Complaint.find({ user: req.user._id }).sort('-createdAt') });
});

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [data, total] = await Promise.all([
    Complaint.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('user', 'name email role').populate('order', 'orderId'),
    Complaint.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.adminUpdate = asyncHandler(async (req, res) => {
  const c = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw new AppError('Complaint not found', 404);
  if (c.user) await notify(c.user, 'Complaint update', `Your complaint "${c.subject}" is now ${c.status}.`, 'system');
  res.json({ success: true, data: c });
});
