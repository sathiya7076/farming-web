import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import { StarInput } from './Stars.jsx';
import SafeImage from './SafeImage.jsx';
import api, { errMsg } from '../services/api';

// Lets a client rate every item of a delivered order they haven't reviewed yet.
export default function ReviewModal({ order, onClose, onDone }) {
  const pending = order.items.filter((i) => !order.reviewedProducts?.includes(i.product));
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState(null);
  const [done, setDone] = useState([]);

  const get = (id) => forms[id] || { rating: 5, comment: '' };
  const set = (id, patch) => setForms({ ...forms, [id]: { ...get(id), ...patch } });

  const submit = async (item) => {
    const f = get(item.product);
    setSaving(item.product);
    try {
      await api.post('/reviews', { orderId: order._id, productId: item.product, rating: f.rating, comment: f.comment || undefined });
      toast.success('Thanks for your review!');
      const next = [...done, item.product];
      setDone(next);
      onDone?.();
      if (next.length === pending.length) onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(null);
    }
  };

  const left = pending.filter((i) => !done.includes(i.product));
  return (
    <Modal open onClose={onClose} title={`Review order ${order.orderId}`} size="md">
      {left.length === 0 && <p className="text-sm text-gray-500">All items reviewed. Thank you!</p>}
      <div className="space-y-5">
        {left.map((it) => (
          <div key={it.product} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center gap-3">
              <SafeImage src={it.image} alt={it.name} className="h-12 w-12 rounded-lg" />
              <p className="font-medium">{it.name}</p>
            </div>
            <StarInput value={get(it.product).rating} onChange={(rating) => set(it.product, { rating })} />
            <textarea
              className="input mt-3"
              rows={3}
              maxLength={1000}
              placeholder="Share your experience (optional)"
              value={get(it.product).comment}
              onChange={(e) => set(it.product, { comment: e.target.value })}
            />
            <button className="btn-primary btn-sm mt-3" disabled={saving === it.product} onClick={() => submit(it)}>
              {saving === it.product ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
