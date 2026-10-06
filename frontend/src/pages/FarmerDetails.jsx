import { Link, useParams } from 'react-router-dom';
import { Award, MapPin, Ruler } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import QueryBoundary from '../components/QueryBoundary.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Stars from '../components/Stars.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fmtDate, initials } from '../utils/format.js';

export default function FarmerDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`/farmers/${id}`);
  const f = data?.farmer;

  return (
    <div className="container-page py-10">
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {f && (
          <>
            <div className="card flex flex-col items-center gap-6 p-8 sm:flex-row">
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-4xl font-bold text-white">{initials(f.user?.name)}</span>
              <div className="text-center sm:text-left">
                <h1 className="font-display text-3xl font-bold">{f.farmName}</h1>
                <p className="text-brand-700">{f.user?.name}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-gray-600 sm:justify-start">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{f.location}</span>
                  {f.farmSize && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{f.farmSize}</span>}
                  {f.experienceYears != null && <span className="flex items-center gap-1"><Award className="h-4 w-4" />{f.experienceYears} yrs experience</span>}
                </div>
                <div className="mt-2"><Stars value={f.ratingAvg} count={f.ratingCount} /></div>
                {f.bio && <p className="mt-3 max-w-2xl text-gray-600">{f.bio}</p>}
                {f.specialties?.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {f.specialties.map((s) => <span key={s} className="rounded-full bg-earth-100 px-3 py-1 text-xs font-semibold text-earth-700">{s}</span>)}
                  </div>
                )}
              </div>
            </div>

            <h2 className="section-title mt-12">Products from this farm</h2>
            {data.products.length === 0 ? (
              <div className="mt-6"><EmptyState title="No products listed" message="This farmer has no available products right now." /></div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.products.map((p) => <ProductCard key={p._id} product={{ ...p, farmer: f }} />)}</div>
            )}

            {data.reviews.length > 0 && (
              <>
                <h2 className="section-title mt-12">Reviews</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {data.reviews.map((r) => (
                    <div key={r._id} className="card p-5">
                      <div className="flex items-center justify-between"><p className="font-semibold">{r.client?.user?.name}</p><Stars value={r.rating} showValue={false} size={14} /></div>
                      <p className="text-xs text-gray-400">on {r.product?.name} · {fmtDate(r.createdAt)}</p>
                      {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-10"><Link to="/farmers" className="text-sm font-semibold text-brand-700">← All farmers</Link></div>
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
