import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ShoppingCart } from 'lucide-react';
import SafeImage from './SafeImage.jsx';
import Stars from './Stars.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { categoryEmoji, farmerName, money } from '../utils/format.js';

export default function ProductCard({ product: p }) {
  const { user } = useAuth();
  const { addToCart, toggleWish, wishIds } = useCart();
  const navigate = useNavigate();
  const wished = Array.isArray(wishIds) ? wishIds.includes(p._id) : false;
  const canBuy = !user || user.role === 'client';

  const requireLogin = (fn) => (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: `/products/${p._id}` } });
    return fn();
  };

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      {/* FIX: fixed height box + overflow-hidden, image full cover */}
      <Link to={`/products/${p._id}`} className="relative block h-44 w-full overflow-hidden">
        <SafeImage
          src={p.images?.[0]?.url}
          alt={p.name}
          emoji={categoryEmoji(p.category?.name)}
          className="h-full w-full !object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{p.category?.name}</span>
        {user?.role === 'client' && (
          <button
            onClick={requireLogin(() => toggleWish(p._id))}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow"
          >
            <Heart className={`h-4 w-4 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/products/${p._id}`} className="line-clamp-1 font-semibold text-gray-900 hover:text-brand-700">{p.name}</Link>
        <p className="text-xs text-gray-500">by {p.farmer?.farmName || farmerName(p.farmer)}</p>
        <p className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{p.location}</p>
        <Stars value={p.ratingAvg} count={p.ratingCount} size={14} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <p><span className="font-display text-lg font-bold text-brand-700">{money(p.price)}</span><span className="text-xs text-gray-500"> / {p.unit}</span></p>
          {canBuy && (
            <button
              onClick={requireLogin(() => addToCart(p._id, 1))}
              disabled={p.quantity < 1}
              className="btn-primary btn-sm"
              aria-label={`Add ${p.name} to cart`}
            >
              <ShoppingCart className="h-4 w-4" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}