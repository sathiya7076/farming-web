import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Package, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Tabs from '../../components/Tabs.jsx';
import SafeImage from '../../components/SafeImage.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import { PRODUCT_STATUSES } from '../../utils/constants.js';
import { money } from '../../utils/format.js';

export default function AdminProducts() {
  const [status, setStatus] = useState('Pending');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, body, pagination, loading, error, reload } = useFetch('/admin/products', { status, q: dq, page, limit: 8 });
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState('');
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [status, dq]);

  const counts = body?.counts || {};
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const tabs = [{ value: '', label: 'All', count: total }, ...PRODUCT_STATUSES.map((s) => ({ value: s, label: s, count: counts[s] || 0 }))];

  const setProductStatus = async (p, st, why) => {
    setBusy(true);
    try {
      await api.put(`/admin/products/${p._id}/status`, { status: st, reason: why || undefined });
      toast.success(`"${p.name}" ${st === 'Rejected' ? 'rejected' : 'approved'}`);
      setReject(null);
      setReason('');
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/products/${del._id}`);
      toast.success('Product deleted');
      setDel(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Products" subtitle="Approve new listings and remove inappropriate ones" />
      <Tabs tabs={tabs} value={status} onChange={setStatus} />
      <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Package} title="No products here" message="Nothing matches this filter." />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Farmer</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p._id}>
                  <td><div className="flex items-center gap-3"><SafeImage src={p.images?.[0]?.url} alt="" className="h-12 w-12 rounded-lg" /><div><p className="font-medium">{p.name}</p><p className="text-xs text-gray-400">{p.productId}</p></div></div></td>
                  <td>{p.farmer?.farmName}</td>
                  <td>{p.category?.name}</td>
                  <td>{money(p.price)}/{p.unit}</td>
                  <td>{p.quantity} {p.unit}</td>
                  <td><StatusBadge status={p.status} />{p.status === 'Rejected' && p.rejectionReason && <p className="mt-1 max-w-[160px] text-xs text-red-600">{p.rejectionReason}</p>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <Link to={`/products/${p._id}`} className="btn-ghost btn-sm"><Eye className="h-4 w-4" /></Link>
                      {['Pending', 'Rejected'].includes(p.status) && <button className="btn-primary btn-sm" disabled={busy} onClick={() => setProductStatus(p, 'Approved')}>Approve</button>}
                      {['Pending', 'Available', 'Approved', 'Out of Stock'].includes(p.status) && <button className="btn-outline btn-sm" onClick={() => setReject(p)}>Reject</button>}
                      <button className="btn-ghost btn-sm text-red-600" onClick={() => setDel(p)} aria-label="Delete product"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>

      <Modal
        open={!!reject} onClose={() => setReject(null)} title={`Reject “${reject?.name}”`} size="sm"
        footer={<><button className="btn-ghost btn-sm" onClick={() => setReject(null)}>Cancel</button><button className="btn-danger btn-sm" disabled={busy} onClick={() => setProductStatus(reject, 'Rejected', reason)}>Reject product</button></>}
      >
        <label className="label" htmlFor="reason">Reason (shown to the farmer)</label>
        <textarea id="reason" rows={3} maxLength={300} className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photos are unclear" />
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title="Delete product?" message={`“${del?.name}” will be removed permanently along with its images and reviews.`} confirmText="Delete" />
    </div>
  );
}
