const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { clientOf } = require('../utils/helpers');

const load = async (clientId) =>
  (await Wishlist.findOne({ client: clientId })) || (await Wishlist.create({ client: clientId, products: [] }));

exports.get = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const w = await load(client._id);
  await w.populate({
    path: 'products',
    populate: [{ path: 'category', select: 'name' }, { path: 'farmer', select: 'farmName location' }],
  });
  res.json({ success: true, data: w.products.filter(Boolean) });
});

exports.toggle = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  if (!(await Product.exists({ _id: req.params.productId }))) throw new AppError('Product not found', 404);
  const w = await load(client._id);
  const idx = w.products.findIndex((id) => String(id) === req.params.productId);
  if (idx >= 0) w.products.splice(idx, 1);
  else w.products.push(req.params.productId);
  await w.save();
  res.json({ success: true, inWishlist: idx < 0, ids: w.products.map(String) });
});
