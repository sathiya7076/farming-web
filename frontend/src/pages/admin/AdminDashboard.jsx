import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, IndianRupee, Package, ShoppingBag, Users, Wheat } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import StatCard from '../../components/StatCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { AreaCard, BarCard, LineCard } from '../../components/Charts.jsx';
import { fmtDate, fmtDateTime, money } from '../../utils/format.js';

const DOT = { user: 'bg-sky-500', order: 'bg-brand-600', product: 'bg-earth-500', review: 'bg-amber-400', complaint: 'bg-red-500' };

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch('/admin/dashboard');
  const activity = useFetch('/admin/activity');
  const c = data?.cards;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Marketplace overview" />
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Wheat} label="Total farmers" value={c.farmers} />
              <StatCard icon={Users} label="Total clients" value={c.clients} tone="blue" />
              <StatCard icon={Package} label="Total products" value={c.products} tone="earth" />
              <StatCard icon={ShoppingBag} label="Total orders" value={c.orders} tone="amber" />
              <StatCard icon={Clock} label="Pending orders" value={c.pending} tone="amber" />
              <StatCard icon={CheckCircle2} label="Completed orders" value={c.completed} />
              <StatCard icon={IndianRupee} label="Total revenue" value={money(c.revenue)} tone="earth" hint="Delivered orders" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <BarCard title="Monthly orders" subtitle="Last 6 months" data={data.charts.monthlyOrders} name="Orders" color="#a97847" />
              <AreaCard title="Monthly revenue" subtitle="Delivered orders" data={data.charts.monthlyRevenue} name="Revenue" format={(v) => `₹${v}`} />
              <BarCard title="Product sales" subtitle="Top products by quantity sold" data={data.charts.productSales} horizontal name="Quantity" />
              <LineCard
                title="Farmer & client registrations"
                subtitle="New sign-ups per month"
                data={data.charts.farmerRegs.map((f, i) => ({ label: f.label, farmers: f.value, clients: data.charts.clientRegs[i]?.value || 0 }))}
                series={[{ key: 'farmers', name: 'Farmers', color: '#3e7c2a' }, { key: 'clients', name: 'Clients', color: '#a97847' }]}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="card overflow-x-auto xl:col-span-2">
                <div className="flex items-center justify-between p-5 pb-2"><h3 className="font-semibold">Recent orders</h3><Link to="/admin/orders" className="text-sm font-semibold text-brand-700">View all</Link></div>
                <table className="tbl">
                  <thead><tr><th>Order</th><th>Customer</th><th>Farmer</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o._id}><td className="font-medium">{o.orderId}</td><td>{o.client?.user?.name}</td><td>{o.farmer?.farmName}</td><td>{money(o.totalAmount)}</td><td><StatusBadge status={o.status} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card p-5">
                <h3 className="mb-3 font-semibold">System activity</h3>
                <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {(activity.data || []).map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[a.type] || 'bg-gray-400'}`} />
                      <div><p className="text-gray-700">{a.text}</p><p className="text-xs text-gray-400">{fmtDateTime(a.at)}</p></div>
                    </li>
                  ))}
                  {activity.loading && <li className="text-sm text-gray-400">Loading…</li>}
                </ul>
              </div>
            </div>

            <div className="card overflow-x-auto">
              <div className="p-5 pb-2"><h3 className="font-semibold">Recent registrations</h3></div>
              <table className="tbl">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>
                  {data.recentUsers.map((u) => (
                    <tr key={u._id}><td className="font-medium">{u.name}</td><td className="text-gray-600">{u.email}</td><td className="capitalize">{u.role}</td><td><StatusBadge status={u.status} /></td><td className="text-gray-500">{fmtDate(u.createdAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
