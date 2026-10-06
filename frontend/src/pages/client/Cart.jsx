import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import { useCart } from '../../context/CartContext.jsx';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import SafeImage from '../../components/SafeImage.jsx';
import { PAYMENT_METHODS } from '../../utils/constants.js';
import { money } from '../../utils/format.js';

const NEW_ADDR = { fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' };

export default function Cart() {
  const navigate = useNavigate();
  const { setCount, refresh } = useCart();
  const cart = useFetch('/cart');
  const profile = useFetch('/profile');
  const addresses = profile.data?.profile?.addresses || [];

  const [addressId, setAddressId] = useState('');
  const [addr, setAddr] = useState(NEW_ADDR);
  const [saveAddress, setSaveAddress] = useState(true);
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (addresses.length && !addressId) setAddressId((addresses.find((a) => a.isDefault) || addresses[0])._id);
  }, [addresses, addressId]);

  // FIX: deleted product (null) irundha skip pannum
  const items = (cart.data?.items || []).filter((i) => i && i.product);
  // FIX: cart.data null-ah irundhaalum crash aagadhu
  const subtotal = cart.data?.subtotal ?? 0;
  const hasUnavailable = items.some((i) => !i.available);
  const useNew = !addresses.length || addressId === 'new';

  const mutate = async (fn) => {
    try {
      const res = await fn();
      setCount(res.data.data.count);
      cart.reload();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const setQty = (item, qty) => qty >= 1 && qty <= item.product.quantity && mutate(() => api.put(`/cart/${item.product._id}`, { quantity: qty }));
  const remove = (item) => mutate(() => api.delete(`/cart/${item.product._id}`));
  const clear = () => mutate(() => api.delete('/cart'));

  const placeOrder = async (e) => {
    e.preventDefault();
    const body = { paymentMethod: payment };
    if (useNew) Object.assign(body, { address: addr, saveAddress });
    else body.addressId = addressId;
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', body);
      toast.success(data.data.length > 1 ? `${data.data.length} orders placed (one per farmer)` : 'Order placed successfully!');
      await refresh();
      navigate('/client/orders');
    } catch (err) {
      toast.error(errMsg(err));
      cart.reload();
    } finally {
      setPlacing(false);
    }
  };

  const setA = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="My Cart" subtitle="Review your items and check out" action={items.length > 0 && <button className="btn-ghost btn-sm" onClick={clear}>Clear cart</button>} />
      <QueryBoundary
        loading={cart.loading} error={cart.error} reload={cart.reload} isEmpty={!items.length}
        empty={<EmptyState icon={ShoppingCart} title="Your cart is empty" message="Add some fresh produce to get started." action={<Link to="/client/browse" className="btn-primary btn-sm">Browse products</Link>} />}
      >
        <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((it) => (
              <div key={it.product._id} className={`card flex gap-4 p-4 ${it.available ? '' : 'opacity-70'}`}>
                <SafeImage src={it.product.images?.[0]?.url} alt={it.product.name} className="h-24 w-24 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/products/${it.product._id}`} className="block truncate font-semibold hover:text-brand-700">{it.product.name}</Link>
                      <p className="text-xs text-gray-500">{it.product.farmer?.farmName} · {it.product.location}</p>
                    </div>
                    <button type="button" onClick={() => remove(it)} className="text-gray-400 hover:text-red-600" aria-label="Remove item"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {!it.available && <p className="mt-1 text-xs font-semibold text-red-600">No longer available — please remove</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-gray-200">
                      <button type="button" className="p-1.5" onClick={() => setQty(it, it.quantity - 1)} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                      <span className="w-12 text-center text-sm">{it.quantity} {it.product.unit}</span>
                      <button type="button" className="p-1.5" onClick={() => setQty(it, it.quantity + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                    </div>
                    <p className="font-semibold text-brand-700">{money(it.lineTotal)}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Delivery address</h2>
              {addresses.length > 0 && (
                <div className="mb-3 space-y-2">
                  {addresses.map((a) => (
                    <label key={a._id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${addressId === a._id ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                      <input type="radio" name="address" className="mt-1" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
                      <span><b>{a.label}</b> — {a.fullName}, {a.phone}<br /><span className="text-gray-500">{a.line1}, {a.city}{a.state ? `, ${a.state}` : ''} {a.pincode}</span></span>
                    </label>
                  ))}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${addressId === 'new' ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                    <input type="radio" name="address" checked={addressId === 'new'} onChange={() => setAddressId('new')} /> Use a new address
                  </label>
                </div>
              )}
              {useNew && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" required placeholder="Full name" value={addr.fullName} onChange={setA('fullName')} />
                  <input className="input" required placeholder="Phone" value={addr.phone} onChange={setA('phone')} />
                  <input className="input sm:col-span-2" required placeholder="Address line" value={addr.line1} onChange={setA('line1')} />
                  <input className="input" required placeholder="City" value={addr.city} onChange={setA('city')} />
                  <input className="input" placeholder="State" value={addr.state} onChange={setA('state')} />
                  <input className="input" placeholder="Pincode" value={addr.pincode} onChange={setA('pincode')} />
                  <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address for next time</label>
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-20">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Payment method</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${payment === m.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                    <input type="radio" name="payment" checked={payment === m.value} onChange={() => setPayment(m.value)} /> {m.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">Online payment is simulated for this demo.</p>
            </div>
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Order summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Items ({items.length})</dt><dd>{money(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="text-brand-700">Arranged by farmer</dd></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold"><dt>Total</dt><dd>{money(subtotal)}</dd></div>
              </dl>
              {hasUnavailable && <p className="mt-3 text-xs text-red-600">Remove unavailable items to continue.</p>}
              <button className="btn-primary mt-4 w-full" disabled={placing || hasUnavailable}>{placing ? 'Placing order…' : 'Place order'}</button>
            </div>
          </aside>
        </form>
      </QueryBoundary>
    </div>
  );
}