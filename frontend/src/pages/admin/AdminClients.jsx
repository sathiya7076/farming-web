import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
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
import { ConfirmModal } from '../../components/Modal.jsx';
import { fmtDate, money } from '../../utils/format.js';

export default function AdminClients() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useFetch('/admin/clients', { status, q: dq, page, limit: 8 });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [status, dq]);

  const apply = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/clients/${confirm.client._id}/status`, { status: confirm.status });
      toast.success(`${confirm.client.user.name} ${confirm.status === 'blocked' ? 'blocked' : 'unblocked'}`);
      setConfirm(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Clients" subtitle="Customers registered on the platform" />
      <Tabs tabs={[{ value: '', label: 'All' }, { value: 'active', label: 'active' }, { value: 'blocked', label: 'blocked' }]} value={status} onChange={setStatus} />
      <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Users} title="No clients found" />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Client</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c._id}>
                  <td><p className="font-medium">{c.user.name}</p><p className="text-xs text-gray-500">{c.user.email}</p></td>
                  <td>{c.user.phone || '—'}</td>
                  <td>{c.orders}</td>
                  <td>{money(c.spent)}</td>
                  <td><StatusBadge status={c.user.status} /></td>
                  <td className="whitespace-nowrap text-gray-500">{fmtDate(c.user.createdAt)}</td>
                  <td>
                    {c.user.status === 'blocked'
                      ? <button className="btn-primary btn-sm" onClick={() => setConfirm({ client: c, status: 'active' })}>Unblock</button>
                      : <button className="btn-outline btn-sm" onClick={() => setConfirm({ client: c, status: 'blocked' })}>Block</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
      <ConfirmModal
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={apply} loading={busy} danger={confirm?.status === 'blocked'}
        title={confirm?.status === 'blocked' ? 'Block client?' : 'Unblock client?'}
        message={confirm ? `${confirm.client.user.name} will ${confirm.status === 'blocked' ? 'no longer be able to log in' : 'be able to log in again'}.` : ''}
      />
    </div>
  );
}
