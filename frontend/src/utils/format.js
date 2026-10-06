export const CURRENCY = '₹';
export const money = (n) => `${CURRENCY}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const farmerName = (f) => f?.user?.name || f?.farmName || 'Farmer';

const EMOJI = {
  Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Pulses: '🫘', Rice: '🍚',
  'Organic Products': '🌿', Spices: '🌶️', Seeds: '🌱', 'Dairy Products': '🥛',
};
export const categoryEmoji = (name) => EMOJI[name] || '🌾';
