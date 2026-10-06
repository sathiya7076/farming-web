const router = require('express').Router();
const { loadController, handler } = require('../utils/routeHelpers');

const c = loadController('categoryController');

// public list. Create / update / delete are under /api/admin/categories
router.get('/', handler(c, 'listPublic', 'categoryController'));

module.exports = router;