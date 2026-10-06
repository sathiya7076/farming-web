import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Pencil, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import SafeImage from '../../components/SafeImage.jsx';
import { ConfirmModal } from '../../components/Modal.jsx';
import { PRODUCT_STATUSES } from '../../utils/constants.js';
import { fmtDate, money } from '../../utils/format.js';

export default function MyProducts() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/products/mine', { q: dq, status, page, limit: 8 });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [dq, status]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/products/${toDelete._id}`);
      toast.success('Product deleted');
      setToDelete(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="My Products" subtitle="Manage everything you sell" action={<Link to="/farmer/products/new" className="btn-primary">+ Add product</Link>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search your products…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <QueryBoundary
        loading={loading} error={error} reload={reload} isEmpty={!data?.length}
        empty={<EmptyState icon={Package} title="No products yet" message="Add your first product to start selling." action={<Link to="/farmer/products/new" className="btn-primary btn-sm">Add product</Link>} />}
      >
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Listed</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <SafeImage src={p.images?.[0]?.url} alt="" className="h-12 w-12 rounded-lg" />
                      <div><p className="font-medium">{p.name}</p><p className="text-xs text-gray-400">{p.productId}</p></div>
                    </div>
                  </td>
                  <td>{p.category?.name}</td>
                  <td>{money(p.price)}/{p.unit}</td>
                  <td>{p.quantity} {p.unit}</td>
                  <td>
                    <StatusBadge status={p.status} />
                    {p.status === 'Rejected' && p.rejectionReason && <p className="mt-1 max-w-[180px] text-xs text-red-600">{p.rejectionReason}</p>}
                  </td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(p.createdAt)}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <Link to={`/farmer/products/${p._id}/edit`} className="btn-outline btn-sm"><Pencil className="h-4 w-4" /> Edit</Link>
                      <button className="btn-ghost btn-sm text-red-600" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
      <ConfirmModal open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy} danger title="Delete product?" message={`“${toDelete?.name}” and its images will be permanently deleted.`} confirmText="Delete" />
    </div>
  );
}
