import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { fmtDate } from '../utils/format.js';

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('New passwords do not match');
    setSaving(true);
    try {
      await api.put('/profile/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="font-semibold">Change password</h2>
      <div><label className="label" htmlFor="cp">Current password</label><input id="cp" type="password" required autoComplete="current-password" className="input" value={form.currentPassword} onChange={set('currentPassword')} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" required minLength={8} autoComplete="new-password" className="input" value={form.newPassword} onChange={set('newPassword')} /></div>
        <div><label className="label" htmlFor="cnp">Confirm new password</label><input id="cnp" type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} /></div>
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}

function ComplaintForm() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [saving, setSaving] = useState(false);
  const { data, reload } = useFetch('/complaints/mine');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/complaints', form);
      toast.success('Complaint submitted. We will get back to you.');
      setForm({ subject: '', message: '' });
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold">Report a problem</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div><label className="label" htmlFor="cs">Subject</label><input id="cs" required minLength={3} className="input" value={form.subject} onChange={set('subject')} /></div>
        <div><label className="label" htmlFor="cm">Describe the issue</label><textarea id="cm" required minLength={10} rows={4} maxLength={2000} className="input" value={form.message} onChange={set('message')} /></div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit complaint'}</button>
      </form>
      {data?.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Your complaints</h3>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {data.map((c) => (
              <li key={c._id} className="p-4 text-sm">
                <div className="flex items-center justify-between gap-2"><p className="font-medium">{c.subject}</p><StatusBadge status={c.status} /></div>
                <p className="text-xs text-gray-400">{fmtDate(c.createdAt)}</p>
                {c.adminResponse && <p className="mt-2 rounded-lg bg-brand-50 p-3 text-gray-700"><b>Admin:</b> {c.adminResponse}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Account security and support" />
      <PasswordForm />
      {user.role !== 'admin' && <ComplaintForm />}
    </div>
  );
}
