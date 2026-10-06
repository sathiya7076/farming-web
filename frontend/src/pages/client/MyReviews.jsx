import { useState } from 'react';
import { Star } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Stars from '../../components/Stars.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';
import SafeImage from '../../components/SafeImage.jsx';
import { fmtDate } from '../../utils/format.js';

export default function MyReviews() {
  const mine = useFetch('/reviews/mine');
  const delivered = useFetch('/orders', { status: 'Delivered', limit: 50 });
  const [reviewing, setReviewing] = useState(null);
  const waiting = (delivered.data || []).filter((o) => o.items.some((i) => !o.reviewedProducts?.includes(i.product)));

  const refresh = () => { mine.reload(); delivered.reload(); };

  return (
    <div className="space-y-8">
      <PageHeader title="Reviews" subtitle="Rate products after they are delivered" />

      {waiting.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Waiting for your review</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {waiting.map((o) => (
              <div key={o._id} className="card flex items-center gap-4 p-4">
                <SafeImage src={o.items[0]?.image} alt="" className="h-14 w-14 rounded-xl" />
                <div className="min-w-0 flex-1"><p className="font-medium">{o.orderId}</p><p className="truncate text-sm text-gray-500">{o.items.map((i) => i.name).join(', ')}</p></div>
                <button className="btn-earth btn-sm" onClick={() => setReviewing(o)}><Star className="h-4 w-4" /> Review</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Your reviews</h2>
        <QueryBoundary loading={mine.loading} error={mine.error} reload={mine.reload} isEmpty={!mine.data?.length} empty={<EmptyState icon={Star} title="No reviews yet" message="Your reviews will appear here." />}>
          <div className="grid gap-4 md:grid-cols-2">
            {mine.data?.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex items-center justify-between"><p className="font-semibold">{r.product?.name || 'Product'}</p><Stars value={r.rating} showValue={false} size={15} /></div>
                <p className="text-xs text-gray-400">{r.farmer?.farmName} · {fmtDate(r.createdAt)}</p>
                {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
              </div>
            ))}
          </div>
        </QueryBoundary>
      </section>

      {reviewing && <ReviewModal order={reviewing} onClose={() => setReviewing(null)} onDone={refresh} />}
    </div>
  );
}
