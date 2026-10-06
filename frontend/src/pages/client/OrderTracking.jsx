import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import OrderTimeline from '../../components/OrderTimeline.jsx';
import { fmtDate, money } from '../../utils/format.js';

export default function OrderTracking() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { data, loading, error, reload } = useFetch('/orders', { limit: 30 });
  const list = (data || []).filter((o) => !activeOnly || !['Delivered', 'Rejected', 'Cancelled'].includes(o.status));

  return (
    <div>
      <PageHeader
        title="Order Tracking"
        subtitle="Follow each order from placement to delivery"
        action={
          <div className="flex rounded-full border border-gray-200 bg-white p-1">
            <button className={`btn-sm rounded-full px-4 py-1.5 text-xs font-semibold ${activeOnly ? 'bg-brand-600 text-white' : 'text-gray-600'}`} onClick={() => setActiveOnly(true)}>Active</button>
            <button className={`btn-sm rounded-full px-4 py-1.5 text-xs font-semibold ${!activeOnly ? 'bg-brand-600 text-white' : 'text-gray-600'}`} onClick={() => setActiveOnly(false)}>All orders</button>
          </div>
        }
      />
      <QueryBoundary
        loading={loading} error={error} reload={reload} isEmpty={!list.length}
        empty={<EmptyState icon={Truck} title={activeOnly ? 'No active orders' : 'No orders yet'} message="Orders you place will be tracked here." action={<Link to="/client/browse" className="btn-primary btn-sm">Shop now</Link>} />}
      >
        <div className="space-y-5">
          {list.map((o) => (
            <div key={o._id} className="card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display font-bold">{o.orderId}</p>
                  <p className="text-xs text-gray-500">{o.farmer?.farmName} · {fmtDate(o.orderDate)} · {money(o.totalAmount)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <OrderTimeline order={o} />
              <p className="mt-4 truncate text-sm text-gray-500">{o.items.map((i) => `${i.name} × ${i.quantity}${i.unit}`).join(', ')}</p>
            </div>
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
