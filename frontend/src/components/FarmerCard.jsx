import { Link } from 'react-router-dom';
import { MapPin, Sprout } from 'lucide-react';
import Stars from './Stars.jsx';
import { initials } from '../utils/format.js';

export default function FarmerCard({ farmer: f }) {
  const name = f.user?.name || f.farmName;
  return (
    <Link to={`/farmers/${f._id}`} className="card flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-2xl font-bold text-white">
        {initials(name)}
      </div>
      <h3 className="mt-3 font-semibold">{name}</h3>
      <p className="text-sm font-medium text-brand-700">{f.farmName}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{f.location}</p>
      <div className="mt-2"><Stars value={f.ratingAvg} count={f.ratingCount} size={14} /></div>
      {f.productCount != null && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Sprout className="h-3.5 w-3.5" /> {f.productCount} product{f.productCount === 1 ? '' : 's'}
        </p>
      )}
    </Link>
  );
}
