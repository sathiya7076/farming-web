import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, IndianRupee, Package, PackageCheck, Wallet } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import StatCard from '../../components/StatCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { AreaCard, BarCard, LineCard } from '../../components/Charts.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate, money } from '../../utils/format.js';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/farmers/me/dashboard');
  const c = data?.cards;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]} 👋`}
        subtitle="Here’s how your farm is doing"
        action={<Link to="/farmer/products/new" className="btn-primary">+ Add product</Link>}
      />
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard icon={Package} label="Total products" value={c.totalProducts} />
              <StatCard icon={PackageCheck} label="Active products" value={c.activeProducts} tone="blue" />
              <StatCard icon={ClipboardList} label="Total orders" value={c.totalOrders} tone="amber" />
              <StatCard icon={CheckCircle2} label="Completed orders" value={c.completedOrders} />
              <StatCard icon={IndianRupee} label="Total sales" value={money(c.totalSales)} tone="earth" />
              <StatCard icon={Wallet} label="Total earnings" value={money(c.totalEarnings)} tone="earth" hint="After platform commission" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <AreaCard title="Monthly sales" subtitle="Delivered orders, last 6 months" data={data.charts.monthlySales} name="Sales" format={(v) => `₹${v}`} />
              <BarCard title="Orders" subtitle="Orders received per month" data={data.charts.monthlyOrders} name="Orders" color="#a97847" />
            </div>
            <LineCard title="Monthly earnings" subtitle="Net of platform commission" data={data.charts.monthlyEarnings} series={[{ key: 'value', name: 'Earnings', color: '#3e7c2a' }]} format={(v) => `₹${v}`} />

            <div className="card overflow-x-auto">
              <div className="flex items-center justify-between p-5 pb-2"><h3 className="font-semibold">Recent orders</h3><Link to="/farmer/orders" className="text-sm font-semibold text-brand-700">View all</Link></div>
              {data.recentOrders.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">No orders yet. Once customers buy your products they will show up here.</p>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o._id}><td className="font-medium">{o.orderId}</td><td>{o.client?.user?.name}</td><td>{money(o.totalAmount)}</td><td><StatusBadge status={o.status} /></td><td className="text-gray-500">{fmtDate(o.orderDate)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
