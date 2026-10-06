import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, money } from '../../utils/format.js';
import { ClipboardList, IndianRupee, TrendingUp } from 'lucide-react';

export default function Sales() {
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/orders', { status: 'Delivered', page, limit: 10 });
  const { data: earn } = useFetch('/farmers/me/earnings');
  const count = pagination?.total ?? 0;

  return (
    <div>
      <PageHeader title="Sales History" subtitle="Every delivered order" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={IndianRupee} label="Total sales" value={money(earn?.gross)} tone="earth" />
        <StatCard icon={ClipboardList} label="Completed orders" value={count} />
        <StatCard icon={TrendingUp} label="Average order" value={money(count && earn ? earn.gross / count : 0)} tone="blue" />
      </div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={BarChart3} title="No sales yet" message="Delivered orders will be listed here." />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Delivered</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {data?.map((o) => (
                <tr key={o._id}>
                  <td className="font-medium">{o.orderId}</td>
                  <td>{o.client?.user?.name}</td>
                  <td className="max-w-[240px] truncate text-gray-600">{o.items.map((i) => `${i.name} × ${i.quantity}${i.unit}`).join(', ')}</td>
                  <td>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(o.deliveryDate)}</td>
                  <td className="text-right font-semibold">{money(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
    </div>
  );
}
