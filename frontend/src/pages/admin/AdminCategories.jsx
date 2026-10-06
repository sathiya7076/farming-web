import { useState } from 'react';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import { categoryEmoji } from '../../utils/format.js';

export default function AdminCategories() {
  const { data, loading, error, reload } = useFetch('/admin/categories');
  const [editing, setEditing] = useState(null); // null | {} (new) | category
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const openForm = (c = {}) => {
    setEditing(c);
    setForm({ name: c.name || '', description: c.description || '', isActive: c.isActive ?? true });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing._id) await api.put(`/admin/categories/${editing._id}`, form);
      else await api.post('/admin/categories', form);
      toast.success(editing._id ? 'Category updated' : 'Category created');
      setEditing(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/categories/${del._id}`);
      toast.success('Category deleted');
      setDel(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); setDel(null); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise products for easier browsing" action={<button className="btn-primary" onClick={() => openForm()}><Plus className="h-4 w-4" /> New category</button>} />
      <QueryBoundary loading={loading} error={error} reload={reload} isEmpty={!data?.length} empty={<EmptyState icon={Tag} title="No categories" />}>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Category</th><th>Description</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c._id}>
                  <td className="font-medium">{categoryEmoji(c.name)} {c.name}</td>
                  <td className="max-w-xs truncate text-gray-600">{c.description || '—'}</td>
                  <td>{c.count}</td>
                  <td><StatusBadge status={c.isActive ? 'active' : 'blocked'} label={c.isActive ? 'Active' : 'Hidden'} /></td>
                  <td><div className="flex gap-1.5"><button className="btn-outline btn-sm" onClick={() => openForm(c)}><Pencil className="h-4 w-4" /> Edit</button><button className="btn-ghost btn-sm text-red-600" onClick={() => setDel(c)} aria-label="Delete category"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit category' : 'New category'} size="sm">
        <form onSubmit={save} className="space-y-4">
          <div><label className="label" htmlFor="cat-name">Name</label><input id="cat-name" required minLength={2} maxLength={60} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="cat-desc">Description</label><textarea id="cat-desc" rows={3} maxLength={300} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible to farmers and customers</label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button>
        </form>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title="Delete category?" message={`“${del?.name}” will be deleted. Categories that still contain products can’t be deleted — hide them instead.`} confirmText="Delete" />
    </div>
  );
}
