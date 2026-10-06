import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, ShieldAlert, Star, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch.js';
import QueryBoundary from '../components/QueryBoundary.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { fmtDateTime } from '../utils/format.js';

const ICONS = { order: Package, product: Package, account: User, review: Star, system: ShieldAlert };

// Shared by farmer, client and admin dashboards.
export default function NotificationsPage({ embedded = false }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, body, pagination, loading, error, reload } = useFetch('/notifications', { page, limit: 10, unread: unreadOnly ? 'true' : '' });

  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const open = async (n) => {
    if (!n.isRead) await api.put(`/notifications/${n._id}/read`).catch(() => {});
    if (n.link) navigate(n.link); else reload();
  };

  return (
    <div>
      {!embedded && <PageHeader title="Notifications" subtitle={`${body?.unread ?? 0} unread`} />}
      {embedded && <h2 className="mb-3 mt-8 font-display text-xl font-bold">Your inbox <span className="text-sm font-normal text-gray-500">({body?.unread ?? 0} unread)</span></h2>}
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>All</button>
        <button className={`btn-sm ${unreadOnly ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>Unread</button>
        <button className="btn-ghost btn-sm ml-auto" onClick={() => run(() => api.put('/notifications/read-all'), 'All marked as read')}><CheckCheck className="h-4 w-4" /> Mark all read</button>
      </div>
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Bell} title="You're all caught up" message="New notifications will appear here." />}>
        <ul className="card divide-y divide-gray-100 overflow-hidden">
          {data?.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <li key={n._id} className={`flex items-start gap-3 p-4 ${n.isRead ? '' : 'bg-brand-50/60'}`}>
                <span className={`mt-0.5 rounded-xl p-2 ${n.isRead ? 'bg-gray-100 text-gray-500' : 'bg-brand-100 text-brand-700'}`}><Icon className="h-4 w-4" /></span>
                <button className="min-w-0 flex-1 text-left" onClick={() => open(n)}>
                  <p className={`text-sm ${n.isRead ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{fmtDateTime(n.createdAt)}</p>
                </button>
                <button className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete notification" onClick={() => run(() => api.delete(`/notifications/${n._id}`))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
        <Pagination pagination={pagination} onChange={setPage} />
      </QueryBoundary>
    </div>
  );
}
