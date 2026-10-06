import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, Heart, MapPin, Minus, Plus, ShoppingCart, Sprout, Truck } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import QueryBoundary from '../components/QueryBoundary.jsx';
import SafeImage from '../components/SafeImage.jsx';
import Stars from '../components/Stars.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { categoryEmoji, fmtDate, initials, money } from '../utils/format.js';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, toggleWish, wishIds } = useCart();
  const { data: p, loading, error, reload } = useFetch(`/products/${id}`);
  const { data: reviews } = useFetch(`/products/${id}/reviews`);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);

  const needLogin = () => navigate('/login', { state: { from: `/products/${id}` } });
  const available = p && ['Approved', 'Available'].includes(p.status) && p.quantity > 0;
  const isClient = user?.role === 'client';

  return (
    <div className="container-page py-10">
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {p && (
          <>
            <nav className="mb-6 text-sm text-gray-500">
              <Link to="/products" className="hover:text-brand-700">Products</Link> / <span>{p.category?.name}</span> / <span className="text-gray-800">{p.name}</span>
            </nav>
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <SafeImage src={p.images?.[img]?.url} alt={p.name} emoji={categoryEmoji(p.category?.name)} className="aspect-[4/3] w-full rounded-2xl" />
                {p.images?.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto">
                    {p.images.map((im, i) => (
                      <button key={im.url} onClick={() => setImg(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === img ? 'border-brand-600' : 'border-transparent'}`}>
                        <SafeImage src={im.url} alt="" className="h-full w-full" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{p.category?.name}</span>
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-gray-400">ID: {p.productId}</span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-bold">{p.name}</h1>
                <div className="mt-2"><Stars value={p.ratingAvg} count={p.ratingCount} /></div>
                <p className="mt-4 font-display text-3xl font-bold text-brand-700">{money(p.price)}<span className="text-base font-normal text-gray-500"> / {p.unit}</span></p>
                <p className="mt-4 text-gray-600">{p.description}</p>

                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-brand-600" /><div><dt className="text-gray-500">Location</dt><dd className="font-medium">{p.location}</dd></div></div>
                  <div className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 text-brand-600" /><div><dt className="text-gray-500">Harvested</dt><dd className="font-medium">{fmtDate(p.harvestDate)}</dd></div></div>
                  <div className="flex items-start gap-2"><Sprout className="mt-0.5 h-4 w-4 text-brand-600" /><div><dt className="text-gray-500">In stock</dt><dd className="font-medium">{p.quantity} {p.unit}</dd></div></div>
                  <div className="flex items-start gap-2"><Truck className="mt-0.5 h-4 w-4 text-brand-600" /><div><dt className="text-gray-500">Listed on</dt><dd className="font-medium">{fmtDate(p.createdAt)}</dd></div></div>
                </dl>

                {(!user || isClient) && (
                  <div className="mt-8 space-y-4">
                    {available ? (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Quantity</span>
                          <div className="flex items-center rounded-full border border-gray-200">
                            <button className="p-2" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                            <input
                              type="number" min="1" max={p.quantity} value={qty} aria-label="Quantity"
                              onChange={(e) => setQty(Math.min(p.quantity, Math.max(1, Number(e.target.value) || 1)))}
                              className="w-14 bg-transparent text-center text-sm outline-none"
                            />
                            <button className="p-2" onClick={() => setQty(Math.min(p.quantity, qty + 1))} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                          </div>
                          <span className="text-sm text-gray-500">{p.unit} · Total {money(p.price * qty)}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button className="btn-primary" onClick={() => (user ? addToCart(p._id, qty) : needLogin())}><ShoppingCart className="h-4 w-4" /> Add to cart</button>
                          <button className="btn-earth" onClick={async () => { if (!user) return needLogin(); if (await addToCart(p._id, qty)) navigate('/client/cart'); }}>Buy now</button>
                          {isClient && (
                            <button className="btn-outline" onClick={() => toggleWish(p._id)}>
                              <Heart className={`h-4 w-4 ${wishIds.includes(p._id) ? 'fill-red-500 text-red-500' : ''}`} /> {wishIds.includes(p._id) ? 'Wishlisted' : 'Wishlist'}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">This product is currently unavailable.</p>
                    )}
                  </div>
                )}
                {user && !isClient && <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Log in with a customer account to purchase products.</p>}

                <Link to={`/farmers/${p.farmer?._id}`} className="card mt-8 flex items-center gap-4 p-4 transition hover:border-brand-200">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-display text-lg font-bold text-white">{initials(p.farmer?.user?.name || p.farmer?.farmName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.farmer?.farmName}</p>
                    <p className="text-sm text-gray-500">{p.farmer?.user?.name} · {p.farmer?.location}</p>
                    <Stars value={p.farmer?.ratingAvg} count={p.farmer?.ratingCount} size={13} />
                  </div>
                  <span className="text-sm font-semibold text-brand-700">View farm →</span>
                </Link>
              </div>
            </div>

            <section className="mt-14">
              <h2 className="section-title">Customer reviews</h2>
              {!reviews?.length ? (
                <p className="mt-4 text-gray-500">No reviews yet. Buyers can review after their order is delivered.</p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {reviews.map((r) => (
                    <div key={r._id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{r.client?.user?.name}</p>
                        <Stars value={r.rating} showValue={false} size={14} />
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
                      <p className="mt-2 text-xs text-gray-400">{fmtDate(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
