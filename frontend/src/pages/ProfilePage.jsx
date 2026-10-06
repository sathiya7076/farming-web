import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import QueryBoundary from '../components/QueryBoundary.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { initials } from '../utils/format.js';

const EMPTY_ADDR = { label: 'Home', fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' };

function Addresses({ profile, reload }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDR);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post('/profile/addresses', form);
      toast.success('Address saved');
      setForm(EMPTY_ADDR);
      setAdding(false);
      reload();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (id) => {
    try { await api.delete(`/profile/addresses/${id}`); toast.success('Address removed'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="card mt-6 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Delivery addresses</h2>
        <button className="btn-outline btn-sm" onClick={() => setAdding(!adding)}><Plus className="h-4 w-4" /> Add address</button>
      </div>
      {adding && (
        <form onSubmit={add} className="mb-5 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
          <input className="input" placeholder="Label (Home, Office)" value={form.label} onChange={set('label')} />
          <input className="input" required placeholder="Full name" value={form.fullName} onChange={set('fullName')} />
          <input className="input" required placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <input className="input" required placeholder="Address line" value={form.line1} onChange={set('line1')} />
          <input className="input" required placeholder="City" value={form.city} onChange={set('city')} />
          <input className="input" placeholder="State" value={form.state} onChange={set('state')} />
          <input className="input" placeholder="Pincode" value={form.pincode} onChange={set('pincode')} />
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary btn-sm">Save address</button><button type="button" className="btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button></div>
        </form>
      )}
      {!profile.addresses?.length ? (
        <p className="text-sm text-gray-500">No saved addresses yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {profile.addresses.map((a) => (
            <li key={a._id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-brand-600" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{a.label} {a.isDefault && <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">Default</span>}</p>
                <p>{a.fullName} · {a.phone}</p>
                <p className="text-gray-500">{a.line1}, {a.city}{a.state ? `, ${a.state}` : ''} {a.pincode}</p>
              </div>
              <button className="text-gray-400 hover:text-red-600" onClick={() => remove(a._id)} aria-label="Delete address"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { data, loading, error, reload } = useFetch('/profile');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p = data.profile || {};
    setForm({
      name: data.user.name || '', phone: data.user.phone || '',
      farmName: p.farmName || '', location: p.location || '', bio: p.bio || '',
      farmSize: p.farmSize || '', experienceYears: p.experienceYears ?? '', specialties: (p.specialties || []).join(', '),
    });
  }, [data]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (user.role === 'farmer') {
        Object.assign(payload, { farmName: form.farmName, location: form.location, bio: form.bio, farmSize: form.farmSize, specialties: form.specialties });
        if (form.experienceYears !== '') payload.experienceYears = form.experienceYears;
      }
      const res = await api.put('/profile', payload);
      setUser(res.data.data.user);
      toast.success('Profile updated');
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Profile" subtitle="Keep your details up to date" />
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {data && (
          <>
            <form onSubmit={save} className="card p-6">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 font-display text-xl font-bold text-white">{initials(data.user.name)}</span>
                <div><p className="font-semibold">{data.user.email}</p><p className="text-sm capitalize text-gray-500">{data.user.role} account</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="p-name">Full name</label><input id="p-name" required minLength={2} className="input" value={form.name || ''} onChange={set('name')} /></div>
                <div><label className="label" htmlFor="p-phone">Phone</label><input id="p-phone" className="input" value={form.phone || ''} onChange={set('phone')} /></div>
                {user.role === 'farmer' && (
                  <>
                    <div><label className="label" htmlFor="p-farm">Farm name</label><input id="p-farm" required className="input" value={form.farmName || ''} onChange={set('farmName')} /></div>
                    <div><label className="label" htmlFor="p-loc">Location</label><input id="p-loc" required className="input" value={form.location || ''} onChange={set('location')} /></div>
                    <div><label className="label" htmlFor="p-size">Farm size</label><input id="p-size" className="input" placeholder="e.g. 10 acres" value={form.farmSize || ''} onChange={set('farmSize')} /></div>
                    <div><label className="label" htmlFor="p-exp">Years of experience</label><input id="p-exp" type="number" min="0" className="input" value={form.experienceYears ?? ''} onChange={set('experienceYears')} /></div>
                    <div className="sm:col-span-2"><label className="label" htmlFor="p-spec">Specialties (comma separated)</label><input id="p-spec" className="input" placeholder="Rice, Pulses" value={form.specialties || ''} onChange={set('specialties')} /></div>
                    <div className="sm:col-span-2"><label className="label" htmlFor="p-bio">About your farm</label><textarea id="p-bio" rows={4} maxLength={1000} className="input" value={form.bio || ''} onChange={set('bio')} /></div>
                  </>
                )}
              </div>
              <button className="btn-primary mt-6" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </form>
            {user.role === 'client' && data.profile && <Addresses profile={data.profile} reload={reload} />}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
