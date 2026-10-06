import { useEffect, useState } from 'react';
import { Eye, Search, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import QueryBoundary from './QueryBoundary.jsx';
import EmptyState from './EmptyState.jsx';
import Pagination from './Pagination.jsx';
import StatusBadge from './StatusBadge.jsx';
import Modal, { ConfirmModal } from './Modal.jsx';
import OrderTimeline from './OrderTimeline.jsx';
import ReviewModal from './ReviewModal.jsx';
import SafeImage from './SafeImage.jsx';
import { ACTION_LABEL, ORDER_STATUSES, nextActions } from '../utils/constants.js';
import { fmtDate, money } from '../utils/format.js';
import { ShoppingBag } from 'lucide-react';

function OrderDetail({ id, onClose }) {
  const { data, loading, error, reload } = useFetch(`/orders/${id}`);
  return (
    <Modal open onClose={onClose} title="Order details" size="lg">
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {data && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg font-bold">{data.order.orderId}</p>
                <p className="text-xs text-gray-500">Placed on {fmtDate(data.order.orderDate)}</p>
              </div>
              <StatusBadge status={data.order.status} />
            </div>
            <OrderTimeline order={data.order} />
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="tbl">
                <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th className="text-right">Subtotal</th></tr></thead>
                <tbody>
                  {data.order.items.map((it) => (
                    <tr key={it.product}>
                      <td><div className="flex items-center gap-3"><SafeImage src={it.image} className="h-10 w-10 rounded-lg" alt="" />{it.name}</div></td>
                      <td>{money(it.price)}/{it.unit}</td>
                      <td>{it.quantity} {it.unit}</td>
                      <td className="text-right">{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="text-right font-semibold">Total</td><td className="text-right font-bold text-brand-700">{money(data.order.totalAmount)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 font-semibold">Customer</p>
                <p>{data.order.client?.user?.name}</p>
                <p className="text-gray-500">{data.order.client?.user?.email}</p>
                <p className="text-gray-500">{data.order.client?.user?.phone}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 font-semibold">Farmer</p>
                <p>{data.order.farmer?.farmName}</p>
                <p className="text-gray-500">{data.order.farmer?.user?.name}</p>
                <p className="text-gray-500">{data.order.farmer?.location}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 font-semibold">Delivery address</p>
                <p>{data.order.deliveryAddress.fullName}</p>
                <p className="text-gray-500">{data.order.deliveryAddress.line1}, {data.order.deliveryAddress.city}{data.order.deliveryAddress.state ? `, ${data.order.deliveryAddress.state}` : ''} {data.order.deliveryAddress.pincode}</p>
                <p className="text-gray-500">{data.order.deliveryAddress.phone}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Payment: <StatusBadge status={data.order.paymentMethod} /> <StatusBadge status={data.order.paymentStatus} /></span>
              {data.payment?.transactionId && <span className="text-gray-500">Txn: {data.payment.transactionId}</span>}
              {data.order.deliveryDate && <span>Delivered on {fmtDate(data.order.deliveryDate)}</span>}
            </div>
          </div>
        )}
      </QueryBoundary>
    </Modal>
  );
}

// One order list used by farmers, clients and admins; actions depend on role.
export default function OrdersPanel({ role, defaultStatus = '' }) {
  const [status, setStatus] = useState(defaultStatus);
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/orders', { status, q: dq, page, limit: 8 });
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPage(1); }, [status, dq]);

  const change = async () => {
    const { order, to } = confirm;
    setBusy(true);
    try {
      await api.put(`/orders/${order._id}/status`, { status: to });
      toast.success(`Order ${order.orderId} is now ${to}`);
      setConfirm(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const unreviewed = (o) => o.status === 'Delivered' && o.items.some((i) => !o.reviewedProducts?.includes(i.product));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by order ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <QueryBoundary
        loading={loading} error={error} reload={reload} isEmpty={!data?.length}
        empty={<EmptyState icon={ShoppingBag} title="No orders found" message="Orders matching your filters will appear here." />}
      >
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Order</th><th>Items</th>
                {role !== 'client' && <th>Customer</th>}
                {role !== 'farmer' && <th>Farmer</th>}
                <th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((o) => (
                <tr key={o._id}>
                  <td className="font-medium">{o.orderId}</td>
                  <td className="max-w-[220px] truncate text-gray-600" title={o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}>
                    {o.items.map((i) => `${i.name} × ${i.quantity}${i.unit}`).join(', ')}
                  </td>
                  {role !== 'client' && <td>{o.client?.user?.name}</td>}
                  {role !== 'farmer' && <td>{o.farmer?.farmName}</td>}
                  <td className="font-semibold">{money(o.totalAmount)}</td>
                  <td><div className="flex flex-col gap-1"><StatusBadge status={o.paymentMethod} /><StatusBadge status={o.paymentStatus} /></div></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(o.orderDate)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => setDetailId(o._id)}><Eye className="h-4 w-4" /> View</button>
                      {nextActions(o.status, role).map((to) => (
                        <button
                          key={to}
                          className={`${['Rejected', 'Cancelled'].includes(to) ? 'btn-outline' : 'btn-primary'} btn-sm`}
                          onClick={() => setConfirm({ order: o, to })}
                        >
                          {ACTION_LABEL[to]}
                        </button>
                      ))}
                      {role === 'client' && unreviewed(o) && (
                        <button className="btn-earth btn-sm" onClick={() => setReviewOrder(o)}><Star className="h-4 w-4" /> Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>

      {detailId && <OrderDetail id={detailId} onClose={() => setDetailId(null)} />}
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onDone={reload} />}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={change}
        loading={busy}
        danger={confirm && ['Rejected', 'Cancelled'].includes(confirm.to)}
        title={confirm ? `${ACTION_LABEL[confirm.to]}?` : ''}
        message={confirm ? `Order ${confirm.order.orderId} will move from ${confirm.order.status} to ${confirm.to}.${['Rejected', 'Cancelled'].includes(confirm.to) ? ' Stock will be restored and any payment refunded.' : ''}` : ''}
        confirmText="Yes, continue"
      />
    </div>
  );
}
