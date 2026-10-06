import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Tabs from '../../components/Tabs.jsx';
import Modal from '../../components/Modal.jsx';
import { fmtDate } from '../../utils/format.js';

export default function AdminComplaints() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/admin/complaints', { status, page, limit: 8 });
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ status: 'In Review', adminResponse: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [status]);

  const show = (c) => { setOpen(c); setForm({ status: c.status === 'Open' ? 'In Review' : c.status, adminResponse: c.adminResponse || '' }); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/admin/complaints/${open._id}`, { status: form.status, adminResponse: form.adminResponse || undefined });
      toast.success('Complaint updated');
      setOpen(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Support requests from customers, farmers and visitors" />
      <Tabs tabs={[{ value: '', label: 'All' }, { value: 'Open', label: 'Open' }, { value: 'In Review', label: 'In Review' }, { value: 'Resolved', label: 'Resolved' }]} value={status} onChange={setStatus} />
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={MessageSquare} title="No complaints" message="You’re all caught up." />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>From</th><th>Subject</th><th>Order</th><th>Status</th><th>Date</th><th /></tr></thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c._id}>
                  <td><p className="font-medium">{c.user?.name || c.name}</p><p className="text-xs text-gray-500">{c.user ? `${c.user.role} · ` : 'visitor · '}{c.user?.email || c.email}</p></td>
                  <td className="max-w-xs"><p className="font-medium">{c.subject}</p><p className="truncate text-xs text-gray-500">{c.message}</p></td>
                  <td>{c.order?.orderId || '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(c.createdAt)}</td>
                  <td><button className="btn-outline btn-sm" onClick={() => show(c)}>Respond</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Complaint" size="md">
        {open && (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4 text-sm"><p className="font-semibold">{open.subject}</p><p className="mt-1 whitespace-pre-wrap text-gray-600">{open.message}</p></div>
            <div>
              <label className="label" htmlFor="cs">Status</label>
              <select id="cs" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['Open', 'In Review', 'Resolved'].map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="cr">Response</label><textarea id="cr" rows={4} maxLength={2000} className="input" value={form.adminResponse} onChange={(e) => setForm({ ...form, adminResponse: e.target.value })} placeholder="Visible to the user who raised it" /></div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
