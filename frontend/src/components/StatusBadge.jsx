const COLORS = {
  Pending: 'bg-amber-100 text-amber-800', pending: 'bg-amber-100 text-amber-800', Open: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800', Available: 'bg-green-100 text-green-800', active: 'bg-green-100 text-green-800',
  Delivered: 'bg-green-100 text-green-800', Paid: 'bg-green-100 text-green-800', Resolved: 'bg-green-100 text-green-800',
  Accepted: 'bg-blue-100 text-blue-700', 'In Review': 'bg-blue-100 text-blue-700',
  Processing: 'bg-indigo-100 text-indigo-700', Shipped: 'bg-purple-100 text-purple-700',
  Rejected: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-700', Cancelled: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700', Failed: 'bg-red-100 text-red-700',
  Refunded: 'bg-orange-100 text-orange-700', 'Out of Stock': 'bg-gray-200 text-gray-700',
  COD: 'bg-earth-100 text-earth-700', MockOnline: 'bg-sky-100 text-sky-700',
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {label || (status === 'MockOnline' ? 'Online' : status)}
    </span>
  );
}
