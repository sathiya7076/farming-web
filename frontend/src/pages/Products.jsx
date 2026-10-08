import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Sprout } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import QueryBoundary from '../components/QueryBoundary.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { categoryEmoji } from '../utils/format.js';

const SORTS = [
  ['latest', 'Latest'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated'],
];

// `embedded` renders without the public page chrome (used inside the client dashboard).
export default function Products({ embedded = false }) {
  const [sp, setSp] = useSearchParams();
  const get = (k) => sp.get(k) || '';
  const [draft, setDraft] = useState({ q: get('q'), location: get('location'), minPrice: get('minPrice'), maxPrice: get('maxPrice') });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setDraft({ q: get('q'), location: get('location'), minPrice: get('minPrice'), maxPrice: get('maxPrice') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const page = Number(get('page')) || 1;
  const params = {
    q: get('q'), category: get('category'), location: get('location'),
    minPrice: get('minPrice'), maxPrice: get('maxPrice'), sort: get('sort') || 'latest', page, limit: 12,
  };
  const { data, pagination, loading, error, reload } = useFetch('/products', params);
  const { data: cats } = useFetch('/categories');
  const { data: locs } = useFetch('/products/meta/locations');

  const update = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setSp(n);
  };
  const apply = (e) => { e.preventDefault(); update(draft); };
  const reset = () => setSp(new URLSearchParams());
  const hasFilters = ['q', 'category', 'location', 'minPrice', 'maxPrice'].some(get);

  const body = (
    <>
      {embedded ? (
        <PageHeader title="Browse Products" subtitle="Find fresh produce from verified farmers" />
      ) : (
        <div className="mb-8"><h1 className="section-title">Fresh Products</h1><p className="mt-2 text-gray-500">Search, filter and buy directly from farmers</p></div>
      )}

      <form onSubmit={apply} className="card mb-6 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search products, locations…" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label="Search products" />
          </div>
          <button type="button" className="btn-outline md:hidden" onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters"><SlidersHorizontal className="h-4 w-4" /></button>
          <button className="btn-primary">Search</button>
        </div>
        <div className={`${showFilters ? 'grid' : 'hidden'} mt-4 gap-3 sm:grid-cols-2 md:grid md:grid-cols-5`}>
          <select className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} aria-label="Location">
            <option value="">All locations</option>
            {locs?.map((l) => <option key={l}>{l}</option>)}
          </select>
          <input className="input" type="number" min="0" placeholder="Min price" value={draft.minPrice} onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Max price" value={draft.maxPrice} onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })} />
          <select className="input" value={get('sort') || 'latest'} onChange={(e) => update({ sort: e.target.value === 'latest' ? '' : e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" className="btn-ghost" onClick={reset} disabled={!hasFilters}>Reset filters</button>
        </div>
      </form>

      {/* FIX: no-scrollbar added, scroll work aagum but bar theriyaadhu */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => update({ category: '' })} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium ${!get('category') ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'}`}>All</button>
        {cats?.map((c) => (
          <button key={c._id} onClick={() => update({ category: c.slug })} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium ${get('category') === c.slug ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'}`}>
            {categoryEmoji(c.name)} {c.name}
          </button>
        ))}
      </div>

      <QueryBoundary
        loading={loading} error={error} reload={reload} isEmpty={!data?.length}
        empty={<EmptyState icon={Sprout} title="No products found" message="Try different keywords or clear some filters." action={hasFilters && <button className="btn-outline btn-sm" onClick={reset}>Clear filters</button>} />}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
        <Pagination pagination={pagination} onChange={(n) => update({ page: n > 1 ? String(n) : '' })} />
      </QueryBoundary>
    </>
  );

  return embedded ? body : <div className="container-page py-10">{body}</div>;
}