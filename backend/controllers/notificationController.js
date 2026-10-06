const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, pageMeta } = require('../utils/helpers');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 15);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const [data, total, unread] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data, unread, pagination: pageMeta(page, limit, total) });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Notification.countDocuments({ user: req.user._id, isRead: false }) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: n });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.remove = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification deleted' });
});
