const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { loadController, handler } = require('../utils/routeHelpers');

const c = loadController('notificationController');
const h = (n) => handler(c, n, 'notificationController');

router.use(protect);

router.get('/', h('list'));
router.get('/unread-count', h('unreadCount'));
router.put('/read-all', h('markAllRead')); // BEFORE '/:id/read'
router.put('/:id/read', h('markRead'));
router.delete('/:id', h('remove'));

module.exports = router;