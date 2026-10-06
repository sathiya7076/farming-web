import { useState } from 'react';
import { Download, IndianRupee, Percent, ShoppingBag, TrendingUp } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { AreaCard, BarCard, PieCard } from '../../components/Charts.jsx';
import { downloadCsv } from '../../utils/csv.js';
import { money } from '../../utils/format.js';

export default function AdminReports() {
  const [range, setRange] = useState({ from: '', to: '' });
  const { data, loading, error, reload } = useFetch('/admin/reports', range);

  const exportCsv = () => {
    const rows = [
      ['AgriConnect sales report', range.from || 'all time', range.to || ''],
      [],
      ['Summary'], ['Revenue', data.summary.revenue], ['Completed orders', data.summary.completedOrders],
      ['Average order value', data.summary.avgOrderValue], [`Commission (${data.summary.feePercent}%)`, data.summary.commission],
      [], ['Revenue by category'], ['Category', 'Revenue', 'Quantity'], ...data.byCategory.map((c) => [c.label, c.value, c.qty]),
      [], ['Top farmers'], ['Farm', 'Revenue', 'Orders'], ...data.topFarmers.map((f) => [f.farmName, f.revenue, f.orders]),
      [], ['Monthly revenue'], ['Month', 'Revenue'], ...data.monthlyRevenue.map((m) => [m.label, m.value]),
    ];
    downloadCsv(`agriconnect-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales and revenue analytics" action={<button className="btn-outline" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4" /> Export CSV</button>} />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="from">From</label><input id="from" type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
        <div><label className="label" htmlFor="to">To</label><input id="to" type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
        {(range.from || range.to) && <button className="btn-ghost" onClick={() => setRange({ from: '', to: '' })}>Clear</button>}
      </div>
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={IndianRupee} label="Revenue" value={money(data.summary.revenue)} tone="earth" />
              <StatCard icon={ShoppingBag} label="Completed orders" value={data.summary.completedOrders} />
              <StatCard icon={TrendingUp} label="Avg. order value" value={money(data.summary.avgOrderValue)} tone="blue" />
              <StatCard icon={Percent} label={`Commission (${data.summary.feePercent}%)`} value={money(data.summary.commission)} tone="amber" />
            </div>
            <AreaCard title="Revenue trend" subtitle="Delivered orders, last 12 months" data={data.monthlyRevenue} name="Revenue" format={(v) => `₹${v}`} />
            <div className="grid gap-6 lg:grid-cols-2">
              {data.byCategory.length > 0 && <PieCard title="Revenue by category" data={data.byCategory} format={(v) => money(v)} />}
              {data.byStatus.length > 0 && <PieCard title="Orders by status" data={data.byStatus} />}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card overflow-x-auto">
                <div className="p-5 pb-2"><h3 className="font-semibold">Top farmers</h3></div>
                <table className="tbl">
                  <thead><tr><th>Farm</th><th>Orders</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.topFarmers.length === 0 && <tr><td colSpan={3} className="text-center text-gray-400">No data</td></tr>}
                    {data.topFarmers.map((f) => <tr key={f._id}><td className="font-medium">{f.farmName}</td><td>{f.orders}</td><td className="text-right">{money(f.revenue)}</td></tr>)}
                  </tbody>
                </table>
              </div>
              {data.byPayment.length > 0 && <BarCard title="Revenue by payment method" data={data.byPayment.map((p) => ({ label: p.label === 'COD' ? 'Cash on delivery' : 'Online', value: p.value }))} name="Revenue" color="#a97847" format={(v) => `₹${v}`} />}
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
