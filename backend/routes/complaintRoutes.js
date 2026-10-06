const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { loadController, handler, v } = require('../utils/routeHelpers');

const c = loadController('complaintController');
const h = (n) => handler(c, n, 'complaintController');

router.post('/', optionalAuth, v(c.createSchema), h('create'));
router.get('/mine', protect, h('mine'));

module.exports = router;