import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import QueryBoundary from '../components/QueryBoundary.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FarmerCard from '../components/FarmerCard.jsx';
import Pagination from '../components/Pagination.jsx';

export default function Farmers() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [dq]);
  const { data, pagination, loading, error, reload } = useFetch('/farmers', { q: dq, page, limit: 12 });

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="section-title">Our Farmers</h1><p className="mt-2 text-gray-500">Verified growers selling directly to you</p></div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by farm or location" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Users} title="No farmers found" message="Try a different search." />}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data?.map((f) => <FarmerCard key={f._id} farmer={f} />)}</div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
    </div>
  );
}
