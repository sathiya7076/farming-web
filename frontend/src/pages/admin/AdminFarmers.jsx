import { useEffect, useState } from 'react';
import { Pencil, Search, Wheat } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Tabs from '../../components/Tabs.jsx';
import Stars from '../../components/Stars.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import { fmtDate } from '../../utils/format.js';

function EditFarmer({ farmer, onClose, onSaved }) {
  const [f, setF] = useState({
    name: farmer.user.name, phone: farmer.user.phone || '', farmName: farmer.farmName, location: farmer.location,
    bio: farmer.bio || '', farmSize: farmer.farmSize || '', experienceYears: farmer.experienceYears ?? '',
    specialties: (farmer.specialties || []).join(', '), featured: !!farmer.featured,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...f, specialties: f.specialties.split(',').map((s) => s.trim()).filter(Boolean) };
      if (body.experienceYears === '') delete body.experienceYears;
      await api.put(`/farmers/${farmer._id}`, body);
      toast.success('Farmer updated');
      onSaved();
      onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${farmer.user.name}`} size="lg">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
        <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
        <div><label className="label">Farm name</label><input className="input" required value={f.farmName} onChange={set('farmName')} /></div>
        <div><label className="label">Location</label><input className="input" required value={f.location} onChange={set('location')} /></div>
        <div><label className="label">Farm size</label><input className="input" value={f.farmSize} onChange={set('farmSize')} /></div>
        <div><label className="label">Experience (years)</label><input type="number" min="0" className="input" value={f.experienceYears} onChange={set('experienceYears')} /></div>
        <div className="sm:col-span-2"><label className="label">Specialties</label><input className="input" value={f.specialties} onChange={set('specialties')} /></div>
        <div className="sm:col-span-2"><label className="label">Bio</label><textarea rows={3} className="input" value={f.bio} onChange={set('bio')} /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Feature this farmer on the home page</label>
        <div className="flex gap-2 sm:col-span-2"><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export default function AdminFarmers() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, body, pagination, loading, error, reload } = useFetch('/admin/farmers', { status, q: dq, page, limit: 8 });
  const [confirm, setConfirm] = useState(null);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [status, dq]);

  const counts = body?.counts || {};
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const tabs = [
    { value: '', label: 'All', count: total },
    ...['pending', 'active', 'rejected', 'blocked'].map((s) => ({ value: s, label: s, count: counts[s] || 0 })),
  ];

  const apply = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/farmers/${confirm.farmer._id}/status`, { status: confirm.status });
      toast.success(`${confirm.farmer.user.name}: ${confirm.label}`);
      setConfirm(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const ask = (farmer, status, label) => setConfirm({ farmer, status, label });

  return (
    <div>
      <PageHeader title="Farmers" subtitle="Approve registrations and manage farmer accounts" />
      <Tabs tabs={tabs} value={status} onChange={setStatus} />
      <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Wheat} title="No farmers found" />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Farmer</th><th>Farm</th><th>Rating</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.map((f) => {
                const s = f.user.status;
                return (
                  <tr key={f._id}>
                    <td><p className="font-medium">{f.user.name}</p><p className="text-xs text-gray-500">{f.user.email}</p></td>
                    <td><p>{f.farmName}</p><p className="text-xs text-gray-500">{f.location}</p></td>
                    <td><Stars value={f.ratingAvg} count={f.ratingCount} size={13} /></td>
                    <td><StatusBadge status={s} /></td>
                    <td className="whitespace-nowrap text-gray-500">{fmtDate(f.user.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {(s === 'pending' || s === 'rejected') && <button className="btn-primary btn-sm" onClick={() => ask(f, 'active', 'approved')}>Approve</button>}
                        {s === 'pending' && <button className="btn-outline btn-sm" onClick={() => ask(f, 'rejected', 'rejected')}>Reject</button>}
                        {s === 'active' && <button className="btn-outline btn-sm" onClick={() => ask(f, 'blocked', 'blocked')}>Block</button>}
                        {s === 'blocked' && <button className="btn-primary btn-sm" onClick={() => ask(f, 'active', 'unblocked')}>Unblock</button>}
                        <button className="btn-ghost btn-sm" onClick={() => setEdit(f)}><Pencil className="h-4 w-4" /> Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>

      <ConfirmModal
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={apply} loading={busy}
        danger={confirm && ['rejected', 'blocked'].includes(confirm.status)}
        title={confirm ? `${confirm.label[0].toUpperCase() + confirm.label.slice(1)} farmer?` : ''}
        message={confirm ? `${confirm.farmer.user.name} (${confirm.farmer.farmName}) will be ${confirm.label} and notified.` : ''}
      />
      {edit && <EditFarmer farmer={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </div>
  );
}
