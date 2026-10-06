import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const withGaps = nums.reduce((acc, n, i) => (i && n - nums[i - 1] > 1 ? [...acc, '…', n] : [...acc, n]), []);

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-gray-500">{total} result{total === 1 ? '' : 's'} · page {page} of {pages}</p>
      <div className="flex items-center gap-1">
        <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {withGaps.map((n, i) =>
          n === '…' ? (
            <span key={`g${i}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`h-8 min-w-8 rounded-full px-2 text-xs font-semibold ${n === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {n}
            </button>
          )
        )}
        <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
