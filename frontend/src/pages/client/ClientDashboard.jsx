import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock, Heart } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import StatCard from '../../components/StatCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate, money } from '../../utils/format.js';

export default function ClientDashboard() {
  const { user } = useAuth();
  const summary = useFetch('/orders/summary');
  const recent = useFetch('/orders', { limit: 5 });
  const recommended = useFetch('/products', { sort: 'rating', limit: 4 });
  const wishlist = useFetch('/wishlist');
  const by = summary.data?.byStatus || {};
  const inProgress = (by.Accepted || 0) + (by.Processing || 0) + (by.Shipped || 0);

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]} 👋`} subtitle="Your orders and favourites at a glance" action={<Link to="/client/browse" className="btn-primary">Browse products</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total orders" value={summary.data?.total ?? '—'} />
        <StatCard icon={Clock} label="Pending / in progress" value={summary.data ? (by.Pending || 0) + inProgress : '—'} tone="amber" />
        <StatCard icon={CheckCircle2} label="Delivered" value={by.Delivered ?? (summary.data ? 0 : '—')} tone="blue" />
        <StatCard icon={Heart} label="Wishlist" value={wishlist.data?.length ?? '—'} tone="red" />
      </div>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between p-5 pb-2"><h2 className="font-semibold">Recent orders</h2><Link to="/client/orders" className="text-sm font-semibold text-brand-700">View all</Link></div>
        <QueryBoundary loading={recent.loading} error={recent.error} reload={recent.reload} isEmpty={!recent.data?.length} empty={<p className="p-5 text-sm text-gray-500">You haven’t placed any orders yet.</p>}>
          <table className="tbl">
            <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th /></tr></thead>
            <tbody>
              {recent.data?.map((o) => (
                <tr key={o._id}>
                  <td className="font-medium">{o.orderId}</td>
                  <td className="max-w-[240px] truncate text-gray-600">{o.items.map((i) => i.name).join(', ')}</td>
                  <td>{money(o.totalAmount)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-gray-500">{fmtDate(o.orderDate)}</td>
                  <td><Link to="/client/tracking" className="text-sm font-semibold text-brand-700">Track</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryBoundary>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Recommended for you</h2>
        <QueryBoundary loading={recommended.loading} error={recommended.error} reload={recommended.reload}>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{recommended.data?.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </QueryBoundary>
      </section>

      {wishlist.data?.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">From your wishlist</h2><Link to="/client/wishlist" className="text-sm font-semibold text-brand-700">See all</Link></div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{wishlist.data.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
