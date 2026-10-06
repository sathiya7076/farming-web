const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler, alias } = require('../utils/routeHelpers');

const c = loadController('wishlistController');
const h = (n) => handler(c, n, 'wishlistController');

router.use(protect, authorize('client'));

router.get('/', h('get'));
router.post('/:id', alias, h('toggle')); // api.post(`/wishlist/${productId}`) adds or removes

module.exports = router;