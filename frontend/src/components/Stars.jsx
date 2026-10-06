import { Star } from 'lucide-react';

export default function Stars({ value = 0, count, size = 16, showValue = true }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs text-gray-500">
          {value ? Number(value).toFixed(1) : 'New'}
          {count != null && value ? ` (${count})` : ''}
        </span>
      )}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
          <Star className={`h-7 w-7 transition ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  );
}
