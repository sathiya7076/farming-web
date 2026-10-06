const router = require('express').Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { loadController, handler, imageUpload, v, alias } = require('../utils/routeHelpers');

const c = loadController('productController');
const r = loadController('reviewController');
const h = (n) => handler(c, n, 'productController');
const upload = imageUpload('images', 6);

// fixed paths first, '/:id' last
router.get('/', optionalAuth, h('list'));
router.get('/meta/locations', h('locations'));
router.get('/mine', protect, authorize('farmer'), h('mine'));
router.get('/:id/reviews', alias, handler(r, 'byProduct', 'reviewController'));
router.get('/:id', optionalAuth, h('getOne'));

// FormData (images): multer runs first, then validation
router.post('/', protect, authorize('farmer'), upload, v(c.createSchema), h('create'));
router.put('/:id', protect, authorize('farmer'), upload, v(c.updateSchema), h('update'));
router.delete('/:id', protect, authorize('farmer', 'admin'), h('remove'));

module.exports = router;