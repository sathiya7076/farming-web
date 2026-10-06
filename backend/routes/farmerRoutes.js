const router = require('express').Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const c = loadController('farmerController');
const h = (n) => handler(c, n, 'farmerController');

router.get('/', optionalAuth, h('list'));
router.get('/me/dashboard', protect, authorize('farmer'), h('dashboard'));
router.get('/me/earnings', protect, authorize('farmer'), h('earnings'));
router.get('/:id', optionalAuth, h('getOne'));
router.put('/:id', protect, authorize('farmer', 'admin'), v(c.updateSchema), h('update'));

module.exports = router;