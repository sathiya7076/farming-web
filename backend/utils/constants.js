exports.ROLES = { FARMER: 'farmer', CLIENT: 'client', ADMIN: 'admin' };
exports.USER_STATUS = ['pending', 'active', 'rejected', 'blocked'];

exports.PRODUCT_STATUS = ['Pending', 'Approved', 'Available', 'Out of Stock', 'Rejected'];
exports.PUBLIC_PRODUCT_STATUS = ['Approved', 'Available'];
exports.UNITS = ['kg', 'g', 'quintal', 'ton', 'litre', 'dozen', 'piece', 'packet'];

exports.ORDER_STATUS = ['Pending', 'Accepted', 'Rejected', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
// Allowed transitions and who may perform them (enforced in the order controller, phase 2)
exports.ORDER_TRANSITIONS = {
  Pending: { Accepted: ['farmer', 'admin'], Rejected: ['farmer', 'admin'], Cancelled: ['client', 'admin'] },
  Accepted: { Processing: ['farmer', 'admin'], Cancelled: ['admin'] },
  Processing: { Shipped: ['farmer', 'admin'], Cancelled: ['admin'] },
  Shipped: { Delivered: ['farmer', 'admin'] },
  Delivered: {},
  Rejected: {},
  Cancelled: {},
};
exports.PAYMENT_METHODS = ['COD', 'MockOnline'];
exports.PAYMENT_STATUS = ['Pending', 'Paid', 'Failed', 'Refunded'];
