export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
            value === t.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'
          }`}
        >
          {t.label}
          {t.count != null && <span className={`ml-2 rounded-full px-1.5 text-xs ${value === t.value ? 'bg-white/25' : 'bg-gray-100'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
