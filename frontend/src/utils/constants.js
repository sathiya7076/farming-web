export const UNITS = ['kg', 'g', 'quintal', 'ton', 'litre', 'dozen', 'piece', 'packet'];
export const PRODUCT_STATUSES = ['Pending', 'Approved', 'Available', 'Out of Stock', 'Rejected'];
export const ORDER_STATUSES = ['Pending', 'Accepted', 'Processing', 'Shipped', 'Delivered', 'Rejected', 'Cancelled'];
export const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'MockOnline', label: 'Online Payment (demo)' },
];

// Mirrors backend ORDER_TRANSITIONS: who may move an order to which status.
export const TRANSITIONS = {
  Pending: { Accepted: ['farmer', 'admin'], Rejected: ['farmer', 'admin'], Cancelled: ['client', 'admin'] },
  Accepted: { Processing: ['farmer', 'admin'], Cancelled: ['admin'] },
  Processing: { Shipped: ['farmer', 'admin'], Cancelled: ['admin'] },
  Shipped: { Delivered: ['farmer', 'admin'] },
};
export const ACTION_LABEL = {
  Accepted: 'Accept', Rejected: 'Reject', Processing: 'Start processing',
  Shipped: 'Mark shipped', Delivered: 'Mark delivered', Cancelled: 'Cancel order',
};
export const nextActions = (status, role) =>
  Object.entries(TRANSITIONS[status] || {}).filter(([, roles]) => roles.includes(role)).map(([to]) => to);

export const TRACK_STEPS = ['Pending', 'Accepted', 'Processing', 'Shipped', 'Delivered'];
