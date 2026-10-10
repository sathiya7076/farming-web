import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { UNITS } from '../../utils/constants.js';
import { toInputDate } from '../../utils/format.js';

const EMPTY = { name: '', category: '', price: '', unit: 'kg', quantity: '', location: '', harvestDate: '', description: '' };

// Used for both "Add Product" and "Edit Product".
export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { data: cats } = useFetch('/categories');
  const { data: existing, loading, error, reload } = useFetch(`/products/${id}`, {}, editing);
  const { data: me } = useFetch('/profile', {}, !editing);

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [saving, setSaving] = useState(false);
  const [mapLink, setMapLink] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name, category: existing.category?._id || '', price: existing.price, unit: existing.unit,
      quantity: existing.quantity, location: existing.location, harvestDate: toInputDate(existing.harvestDate), description: existing.description,
    });
    setMapLink(existing.mapLink || '');
  }, [existing]);

  useEffect(() => {
    if (me?.profile?.location) setForm((f) => (f.location ? f : { ...f, location: me.profile.location }));
  }, [me]);

  // Preview: pull lat/lng out of a Google Maps link (@lat,lng / q=lat,lng / !3d..!4d..)
  const coords = (() => {
    const m =
      mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      mapLink.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      mapLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    return m ? { lat: m[1], lng: m[2] } : null;
  })();

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported in this browser');
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapLink(`https://www.google.com/maps?q=${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
      () => toast.error('Could not get your location. Please allow location access.')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const kept = (existing?.images || []).filter((i) => !removed.includes(i.publicId || i.url));
    if (kept.length + files.length < 1) return toast.error('Please add at least one product image');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('mapLink', mapLink.trim());
    files.forEach((f) => fd.append('images', f));
    if (editing) fd.append('removeImages', JSON.stringify(removed));

    setSaving(true);
    try {
      if (editing) await api.put(`/products/${id}`, fd);
      else await api.post('/products', fd);
      toast.success(editing ? 'Product updated' : 'Product submitted for admin approval');
      navigate('/farmer/products');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={editing ? 'Edit Product' : 'Add Product'} subtitle={editing ? 'Update your listing' : 'New listings are reviewed by an admin before going live'} />
      <QueryBoundary loading={editing && loading} error={error} reload={reload}>
        <form onSubmit={submit} className="card space-y-5 p-6">
          {editing && existing && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Status: <StatusBadge status={existing.status} />
              {existing.status === 'Rejected' && existing.rejectionReason && <span className="text-red-600">— {existing.rejectionReason}</span>}
              {existing.status === 'Rejected' && <span className="text-gray-500">Saving changes will re-submit it for approval.</span>}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="pf-name">Product / crop name</label><input id="pf-name" required minLength={2} maxLength={120} className="input" value={form.name} onChange={set('name')} /></div>
            <div>
              <label className="label" htmlFor="pf-cat">Category</label>
              <select id="pf-cat" required className="input" value={form.category} onChange={set('category')}>
                <option value="">Select category</option>
                {cats?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="pf-loc">Location</label><input id="pf-loc" required className="input" value={form.location} onChange={set('location')} /></div>
            <div><label className="label" htmlFor="pf-price">Price per unit (₹)</label><input id="pf-price" type="number" required min="0.01" step="0.01" className="input" value={form.price} onChange={set('price')} /></div>
            <div>
              <label className="label" htmlFor="pf-unit">Unit</label>
              <select id="pf-unit" className="input" value={form.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="pf-qty">Quantity available</label><input id="pf-qty" type="number" required min="0" step="any" className="input" value={form.quantity} onChange={set('quantity')} /></div>
            <div><label className="label" htmlFor="pf-date">Harvest date</label><input id="pf-date" type="date" required className="input" value={form.harvestDate} onChange={set('harvestDate')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="pf-desc">Description</label><textarea id="pf-desc" required minLength={10} maxLength={2000} rows={5} className="input" placeholder="Variety, farming method, taste, how it is packed…" value={form.description} onChange={set('description')} /></div>
          </div>

          {/* NEW: Google Map location */}
          <div>
            <label className="label" htmlFor="pf-map">Google Map location <span className="text-gray-400">(optional)</span></label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="pf-map"
                type="url"
                maxLength={500}
                className="input flex-1"
                placeholder="Paste Google Maps link of your farm / pickup point"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
              />
              <button type="button" className="btn-ghost" onClick={useMyLocation}>📍 Use my current location</button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Google Maps-la place open pannitu Share → Copy link paste pannunga.</p>
            {coords && (
              <iframe
                title="Map preview"
                className="mt-3 h-56 w-full rounded-lg border"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
              />
            )}
            {mapLink && !coords && (
              <a href={mapLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-green-700 underline">Open in Google Maps</a>
            )}
          </div>

          <div>
            <label className="label">Product images</label>
            <ImageUploader existing={existing?.images || []} files={files} setFiles={setFiles} removed={removed} setRemoved={setRemoved} />
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Submit for approval'}</button>
            <button type="button" className="btn-ghost" onClick={() => navigate('/farmer/products')}>Cancel</button>
          </div>
        </form>
      </QueryBoundary>
    </div>
  );
}