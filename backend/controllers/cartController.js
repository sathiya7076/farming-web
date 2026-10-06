const { z } = require('zod');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { PUBLIC_PRODUCT_STATUS: PUBLIC } = require('../utils/constants');
const { clientOf } = require('../utils/helpers');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
exports.addSchema = z.object({ productId: objectId, quantity: z.coerce.number().int().min(1).default(1) });
exports.updateSchema = z.object({ quantity: z.coerce.number().int().min(1) });

const buildCart = async (clientId) => {
  let cart = await Cart.findOne({ client: clientId }).populate({
    path: 'items.product',
    select: 'name images price unit quantity status farmer location',
    populate: { path: 'farmer', select: 'farmName' },
  });
  if (!cart) cart = await Cart.create({ client: clientId, items: [] });
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => {
      const p = i.product;
      const available = PUBLIC.includes(p.status) && p.quantity > 0;
      return { product: p, quantity: Math.min(i.quantity, Math.max(p.quantity, 1)), available, lineTotal: available ? p.price * i.quantity : 0 };
    });
  return { items, count: items.length, subtotal: items.reduce((s, i) => s + i.lineTotal, 0) };
};

exports.get = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  res.json({ success: true, data: await buildCart(client._id) });
});

exports.add = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const { productId, quantity } = req.body;
  const p = await Product.findById(productId);
  if (!p || !PUBLIC.includes(p.status) || p.quantity < 1) throw new AppError('This product is not available', 400);

  const cart = (await Cart.findOne({ client: client._id })) || new Cart({ client: client._id, items: [] });
  const existing = cart.items.find((i) => String(i.product) === String(productId));
  const qty = Math.min((existing ? existing.quantity : 0) + quantity, p.quantity);
  if (existing) existing.quantity = qty;
  else cart.items.push({ product: p._id, quantity: qty });
  await cart.save();
  res.json({ success: true, data: await buildCart(client._id) });
});

exports.update = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  const p = await Product.findById(req.params.productId);
  if (!p) throw new AppError('Product not found', 404);
  const cart = await Cart.findOne({ client: client._id });
  const item = cart?.items.find((i) => String(i.product) === req.params.productId);
  if (!item) throw new AppError('Item not in cart', 404);
  item.quantity = Math.min(req.body.quantity, Math.max(p.quantity, 1));
  await cart.save();
  res.json({ success: true, data: await buildCart(client._id) });
});

exports.remove = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  await Cart.updateOne({ client: client._id }, { $pull: { items: { product: req.params.productId } } });
  res.json({ success: true, data: await buildCart(client._id) });
});

exports.clear = asyncHandler(async (req, res) => {
  const client = await clientOf(req.user);
  await Cart.updateOne({ client: client._id }, { $set: { items: [] } });
  res.json({ success: true, data: await buildCart(client._id) });
});
