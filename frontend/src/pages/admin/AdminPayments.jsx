import { useEffect, useState } from 'react';
import { CreditCard, RotateCcw, Wallet, Clock } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { fmtDate, money } from '../../utils/format.js';

export default function AdminPayments() {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const { data, body, pagination, loading, error, reload } = useFetch('/admin/payments', { status, method, page, limit: 10 });
  useEffect(() => { setPage(1); }, [status, method]);
  const t = body?.totals || {};

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track money moving through the marketplace" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Paid" value={money(t.Paid)} />
        <StatCard icon={Clock} label="Pending (COD)" value={money(t.Pending)} tone="amber" />
        <StatCard icon={RotateCcw} label="Refunded" value={money(t.Refunded)} tone="red" />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{['Pending', 'Paid', 'Failed', 'Refunded'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input sm:w-48" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">All methods</option><option value="COD">Cash on Delivery</option><option value="MockOnline">Online (demo)</option>
        </select>
      </div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={CreditCard} title="No payments found" />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Farmer</th><th>Method</th><th>Transaction</th><th>Status</th><th>Date</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p._id}>
                  <td className="font-medium">{p.order?.orderId}</td>
                  <td>{p.client?.user?.name}</td>
                  <td>{p.farmer?.farmName}</td>
                  <td><StatusBadge status={p.method} /></td>
                  <td className="text-xs text-gray-500">{p.transactionId || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(p.createdAt)}</td>
                  <td className="text-right font-semibold">{money(p.amount)}</td>
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
