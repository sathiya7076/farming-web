const { z } = require('zod');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, pageMeta, clientOf, farmerOf } = require('../utils/helpers');
const { notify } = require('../utils/notify');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
exports.createSchema = z.object({
  orderId: objectId,
  productId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const recalc = async (productId, farmerId) => {
  const agg = async (match) => {
    const [r] = await Review.aggregate([
      { $match: { ...match, isVisible: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]);
    return { ratingAvg: r ? Math.round(r.avg * 10) / 10 : 0, ratingCount: r ? r.n : 0 };
  };
  await Product.findByIdAndUpdate(productId, await agg({ product: productId }));
  await Farmer.findByIdAndUpdate(farmerId, await agg({ farmer: farmerId }));
};
exports.recalc = recalc;

const populateReview = (q) =>
  q
    .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'name' } })
    .populate('product', 'name images')
    .populate({ path: 'farmer', select: 'farmName' });

exports.create = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const { orderId, productId, rating, comment } = req.body;
  const order = await Order.findOne({ _id: orderId, client: client._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'Delivered') throw new AppError('You can review items only after delivery', 400);
  if (!order.items.some((i) => String(i.product) === productId)) throw new AppError('Product is not part of this order', 400);
  if (order.reviewedProducts.some((p) => String(p) === productId)) throw new AppError('You already reviewed this item', 409);

  const review = await Review.create({ product: productId, farmer: order.farmer, client: client._id, order: order._id, rating, comment });
  order.reviewedProducts.push(productId);
  await order.save();
  await recalc(productId, order.farmer);

  const farmer = await Farmer.findById(order.farmer);
  await notify(farmer.user, 'New review', `You received a ${rating}-star review.`, 'review', '/farmer/reviews');
  res.status(201).json({ success: true, data: review });
});

exports.byProduct = asyncHandler(async (req, res) => {
  const data = await populateReview(Review.find({ product: req.params.id, isVisible: true }).sort('-createdAt').limit(30));
  res.json({ success: true, data });
});

exports.mine = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const data = await populateReview(Review.find({ client: client._id }).sort('-createdAt'));
  res.json({ success: true, data });
});

exports.forFarmer = asyncHandler(async (req, res) => {
  const farmer = await farmerOf(req.user);
  const data = await populateReview(Review.find({ farmer: farmer._id, isVisible: true }).sort('-createdAt'));
  res.json({ success: true, data, summary: { ratingAvg: farmer.ratingAvg, ratingCount: farmer.ratingCount } });
});

// ---------- admin ----------
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 10);
  const filter = {};
  if (req.query.rating) filter.rating = Number(req.query.rating);
  const [data, total] = await Promise.all([
    populateReview(Review.find(filter).sort('-createdAt').skip(skip).limit(limit)),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) });
});

exports.adminRemove = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  await Order.updateOne({ _id: review.order }, { $pull: { reviewedProducts: review.product } });
  await recalc(review.product, review.farmer);
  res.json({ success: true, message: 'Review removed' });
});
