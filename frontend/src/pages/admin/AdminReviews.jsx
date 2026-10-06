import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Stars from '../../components/Stars.jsx';
import { ConfirmModal } from '../../components/Modal.jsx';
import { fmtDate } from '../../utils/format.js';

export default function AdminReviews() {
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/admin/reviews', { rating, page, limit: 10 });
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [rating]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/reviews/${del._id}`);
      toast.success('Review removed');
      setDel(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Remove reviews that break community guidelines" />
      <select className="input mb-4 sm:w-48" value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="">All ratings</option>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
      </select>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Star} title="No reviews found" />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Customer</th><th>Farmer</th><th>Rating</th><th>Comment</th><th>Date</th><th /></tr></thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r._id}>
                  <td className="font-medium">{r.product?.name}</td>
                  <td>{r.client?.user?.name}</td>
                  <td>{r.farmer?.farmName}</td>
                  <td><Stars value={r.rating} showValue={false} size={14} /></td>
                  <td className="max-w-xs text-gray-600">{r.comment || <span className="italic text-gray-400">—</span>}</td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(r.createdAt)}</td>
                  <td><button className="btn-ghost btn-sm text-red-600" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /> Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title="Remove review?" message="The review will be deleted and product/farmer ratings recalculated." confirmText="Remove" />
    </div>
  );
}
