const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { loadController, handler } = require('../utils/routeHelpers');

const c = loadController('clientController');
const h = (n) => handler(c, n, 'clientController');

router.use(protect, authorize('client'));

router.get('/profile', h('getProfile'));
router.put('/profile', h('updateProfile'));
router.post('/addresses', h('addAddress'));
router.put('/addresses/:addressId', h('updateAddress'));
router.delete('/addresses/:addressId', h('deleteAddress'));

module.exports = router;