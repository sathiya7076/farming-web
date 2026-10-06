const TONES = {
  green: 'bg-brand-50 text-brand-700',
  earth: 'bg-earth-100 text-earth-700',
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export default function StatCard({ icon: Icon, label, value, tone = 'green', hint }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${TONES[tone]}`}>{Icon && <Icon className="h-6 w-6" />}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="truncate font-display text-2xl font-bold text-gray-900">{value}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}
