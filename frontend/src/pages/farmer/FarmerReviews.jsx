import { Star } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Stars from '../../components/Stars.jsx';
import { fmtDate } from '../../utils/format.js';

export default function FarmerReviews() {
  const { data, body, loading, error, reload } = useFetch('/reviews/farmer');
  return (
    <div>
      <PageHeader title="Reviews" subtitle="What customers say about your products" action={body?.summary?.ratingCount > 0 && <div className="card px-4 py-2"><Stars value={body.summary.ratingAvg} count={body.summary.ratingCount} /></div>} />
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Star} title="No reviews yet" message="Customers can review items once their order is delivered." />}>
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-center justify-between"><p className="font-semibold">{r.client?.user?.name}</p><Stars value={r.rating} showValue={false} size={15} /></div>
              <p className="text-xs text-gray-400">on {r.product?.name} · {fmtDate(r.createdAt)}</p>
              {r.comment ? <p className="mt-2 text-sm text-gray-700">{r.comment}</p> : <p className="mt-2 text-sm italic text-gray-400">No written comment</p>}
            </div>
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
