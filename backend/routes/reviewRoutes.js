const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const c = loadController('reviewController');
const h = (n) => handler(c, n, 'reviewController');

router.get('/farmer', protect, authorize('farmer'), h('forFarmer'));
router.get('/mine', protect, authorize('client'), h('mine'));
router.post('/', protect, authorize('client'), v(c.createSchema), h('create'));
// product reviews: GET /api/products/:id/reviews (defined in productRoutes.js)

module.exports = router;