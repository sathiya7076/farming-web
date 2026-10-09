import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Leaf, Quote, Search, ShieldCheck, ShoppingCart, Sprout, Truck, Wallet } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import QueryBoundary from '../components/QueryBoundary.jsx';
import ProductCard from '../components/ProductCard.jsx';
import FarmerCard from '../components/FarmerCard.jsx';
import Stars from '../components/Stars.jsx';
import HomeLogin from '../components/HomeLogin.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { categoryEmoji } from '../utils/format.js';

const STEPS = [
  { icon: Search, title: 'Browse', text: 'Explore fresh produce listed directly by verified farmers.' },
  { icon: ShoppingCart, title: 'Order', text: 'Add to cart, choose your address and payment method.' },
  { icon: Sprout, title: 'Farmer prepares', text: 'The farmer accepts, packs and ships your order.' },
  { icon: Truck, title: 'Delivered fresh', text: 'Receive it at your door, then rate your experience.' },
];
const WHY = [
  { icon: Leaf, title: 'Farm fresh', text: 'Harvest dates on every product so you know what you get.' },
  { icon: Wallet, title: 'Fair prices', text: 'No middlemen. Farmers set the price and keep more of it.' },
  { icon: ShieldCheck, title: 'Verified farmers', text: 'Every farmer and product is reviewed by our admin team.' },
  { icon: BadgeCheck, title: 'Real reviews', text: 'Only customers with delivered orders can leave ratings.' },
];

// ADDED: reusable horizontal scroller with left/right side buttons
function ScrollRow({ items, render }) {
  const ref = useRef(null);
  const go = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: 'smooth' });
  };
  const btn = 'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg ring-1 ring-gray-200 transition hover:bg-brand-50 sm:flex';
  return (
    <div className="relative">
      <button type="button" onClick={() => go(-1)} aria-label="Scroll left" className={`${btn} -left-3`}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <div key={item._id} className="w-64 shrink-0 snap-start sm:w-72">{render(item)}</div>
        ))}
      </div>
      <button type="button" onClick={() => go(1)} aria-label="Scroll right" className={`${btn} -right-3`}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Home() {
  const { data, loading, error, reload } = useFetch('/public/home');
  const { user, loading: authLoading } = useAuth();
  const showLogin = !authLoading && !user;
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const search = (e) => {
    e.preventDefault();
    navigate(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  // ADDED: latest products - existing /products list endpoint (sort=latest) use panrom, backend change thevai illa
  const { data: latestRes } = useFetch('/products?sort=latest&limit=8');
  const latestProducts = Array.isArray(latestRes) ? latestRes : latestRes?.data ?? [];
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=70"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className={showLogin ? 'grid items-center gap-10 lg:grid-cols-[1fr_380px]' : ''}>
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
                <Leaf className="h-4 w-4" /> Smart Farming Marketplace
              </p>
              <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-6xl">Fresh From Farmers</h1>
              <p className="mt-4 max-w-xl text-lg text-brand-50">Buy vegetables, fruits, grains and more straight from the people who grow them.</p>
              <form onSubmit={search} className="mt-8 flex max-w-xl overflow-hidden rounded-full bg-white p-1.5 shadow-xl">
                <div className="flex flex-1 items-center gap-2 px-4">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tomatoes, rice, mangoes…" className="w-full bg-transparent py-2 text-gray-800 outline-none placeholder:text-gray-400" aria-label="Search products" />
                </div>
                <button className="btn-primary px-6">Search</button>
              </form>
              {data && (
                <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                  {[['Farmers', data.stats.farmers], ['Products', data.stats.products], ['Customers', data.stats.clients], ['Orders delivered', data.stats.delivered]].map(([l, v]) => (
                    <div key={l}><dt className="text-xs uppercase tracking-wide text-brand-100">{l}</dt><dd className="font-display text-3xl font-bold">{v}+</dd></div>
                  ))}
                </dl>
              )}
            </div>

            <HomeLogin />
          </div>
        </div>
      </section>

      <div className="container-page space-y-20 py-16">
        <QueryBoundary loading={loading} error={error} reload={reload}>
          {data && (
            <>
              {/* Categories */}
              <section>
                <div className="mb-8 text-center"><h2 className="section-title">Browse Categories</h2><p className="mt-2 text-gray-500">Everything the farm grows, in one place</p></div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {data.categories.map((c) => (
                    <Link key={c._id} to={`/products?category=${c.slug}`} className="card flex flex-col items-center p-5 text-center transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg">
                      <span className="text-4xl">{categoryEmoji(c.name)}</span>
                      <span className="mt-2 font-semibold">{c.name}</span>
                      <span className="text-xs text-gray-500">{c.count} product{c.count === 1 ? '' : 's'}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* ADDED: Latest products (currently added products) */}
              <section>
                <div className="mb-8 flex items-end justify-between">
                  <div><h2 className="section-title">Latest Products</h2><p className="mt-2 text-gray-500">Freshly added by our farmers</p></div>
                  <Link to="/products?sort=latest" className="hidden items-center gap-1 text-sm font-semibold text-brand-700 sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
                </div>
                {latestProducts.length === 0 ? (
                  <p className="text-center text-gray-500">No products added yet.</p>
                ) : (
                  <ScrollRow items={latestProducts} render={(p) => <ProductCard product={p} />} />
                )}
              </section>

              {/* Featured products */}
              <section>
                <div className="mb-8 flex items-end justify-between">
                  <div><h2 className="section-title">Featured Products</h2><p className="mt-2 text-gray-500">Hand-picked and top rated</p></div>
                  <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-brand-700 sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <ScrollRow items={data.featuredProducts} render={(p) => <ProductCard product={p} />} />
              </section>

              {/* Featured farmers */}
              <section>
                <div className="mb-8 text-center"><h2 className="section-title">Featured Farmers</h2><p className="mt-2 text-gray-500">Meet the people behind your food</p></div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {data.featuredFarmers.map((f) => <FarmerCard key={f._id} farmer={f} />)}
                </div>
              </section>
            </>
          )}
        </QueryBoundary>

        {/* How it works */}
        <section>
          <div className="mb-8 text-center"><h2 className="section-title">How It Works</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card relative p-6 text-center">
                <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-earth-500 text-xs font-bold text-white">{i + 1}</span>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><s.icon className="h-7 w-7" /></div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why choose */}
        <section className="rounded-3xl bg-earth-50 px-6 py-12 sm:px-12">
          <div className="mb-8 text-center"><h2 className="section-title">Why Choose AgriConnect</h2></div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-earth-600 shadow-soft"><w.icon className="h-7 w-7" /></div>
                <h3 className="mt-3 font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        {data?.reviews?.length > 0 && (
          <section>
            <div className="mb-8 text-center"><h2 className="section-title">Customer Reviews</h2><p className="mt-2 text-gray-500">What our customers say</p></div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.reviews.map((r) => (
                <div key={r._id} className="card p-6">
                  <Quote className="h-6 w-6 text-brand-300" />
                  <p className="mt-2 text-sm text-gray-700">{r.comment}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div><p className="text-sm font-semibold">{r.client?.user?.name}</p><p className="text-xs text-gray-500">on {r.product?.name}</p></div>
                    <Stars value={r.rating} showValue={false} size={14} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-14 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-bold text-white">Ready to grow with AgriConnect?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">Farmers: reach thousands of customers. Shoppers: taste the difference of truly fresh food.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50">Start Selling</Link>
            <Link to="/products" className="btn border border-white text-white hover:bg-white/10">Start Shopping</Link>
          </div>
        </section>
      </div>
    </>
  );
}