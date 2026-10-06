import { Check, X } from 'lucide-react';
import { TRACK_STEPS } from '../utils/constants.js';
import { fmtDateTime } from '../utils/format.js';

// Visual tracker for the order workflow: Pending → Accepted → Processing → Shipped → Delivered
export default function OrderTimeline({ order }) {
  const failed = ['Rejected', 'Cancelled'].includes(order.status);
  const current = TRACK_STEPS.indexOf(order.status);
  const at = (s) => order.statusHistory?.find((h) => h.status === s)?.at;

  return (
    <div>
      {failed && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="h-4 w-4" /> This order was {order.status.toLowerCase()} on {fmtDateTime(at(order.status))}.
        </div>
      )}
      <ol className="grid gap-4 sm:grid-cols-5">
        {TRACK_STEPS.map((s, i) => {
          const done = !failed && i <= current;
          const active = !failed && i === current;
          return (
            <li key={s} className="flex items-center gap-3 sm:flex-col sm:text-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  done ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-400'
                } ${active ? 'ring-4 ring-brand-100' : ''}`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span>
                <span className={`block text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                <span className="block text-xs text-gray-400">{done ? fmtDateTime(at(s) || (s === 'Pending' ? order.orderDate : null)) : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
