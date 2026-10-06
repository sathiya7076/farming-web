import { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import PageHeader from '../../components/PageHeader.jsx';
import NotificationsPage from '../NotificationsPage.jsx';

export default function AdminNotifications() {
  const [form, setForm] = useState({ target: 'all', userId: '', title: '', message: '' });
  const [sending, setSending] = useState(false);
  const farmers = useFetch('/admin/farmers', { limit: 50 });
  const clients = useFetch('/admin/clients', { limit: 50 });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const body = { target: form.target, title: form.title, message: form.message };
      if (form.target === 'user') body.userId = form.userId;
      const { data } = await api.post('/admin/notifications', body);
      toast.success(data.message);
      setForm({ ...form, title: '', message: '' });
    } catch (err) { toast.error(errMsg(err)); } finally { setSending(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifications" subtitle="Send announcements to users" />
      <form onSubmit={send} className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="n-target">Send to</label>
            <select id="n-target" className="input" value={form.target} onChange={set('target')}>
              <option value="all">Everyone (farmers & clients)</option><option value="farmers">All farmers</option><option value="clients">All clients</option><option value="user">A specific user</option>
            </select>
          </div>
          {form.target === 'user' && (
            <div>
              <label className="label" htmlFor="n-user">User</label>
              <select id="n-user" required className="input" value={form.userId} onChange={set('userId')}>
                <option value="">Select user</option>
                <optgroup label="Farmers">{farmers.data?.map((f) => <option key={f._id} value={f.user._id}>{f.user.name} — {f.farmName}</option>)}</optgroup>
                <optgroup label="Clients">{clients.data?.map((c) => <option key={c._id} value={c.user._id}>{c.user.name} — {c.user.email}</option>)}</optgroup>
              </select>
            </div>
          )}
        </div>
        <div><label className="label" htmlFor="n-title">Title</label><input id="n-title" required minLength={2} maxLength={100} className="input" value={form.title} onChange={set('title')} /></div>
        <div><label className="label" htmlFor="n-msg">Message</label><textarea id="n-msg" required minLength={2} maxLength={500} rows={4} className="input" value={form.message} onChange={set('message')} /></div>
        <button className="btn-primary" disabled={sending}><Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send notification'}</button>
      </form>
      <NotificationsPage embedded />
    </div>
  );
}
