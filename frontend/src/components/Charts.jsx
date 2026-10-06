import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

export const COLORS = ['#3e7c2a', '#a97847', '#6db44e', '#cfb08a', '#2b4f21', '#94cb78', '#744b30', '#bce0a8'];

function Wrap({ title, subtitle, height = 260, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      <div style={{ height }} className="mt-4">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

const axis = { tick: { fontSize: 11, fill: '#6b7280' }, axisLine: false, tickLine: false };

export function BarCard({ title, subtitle, data, dataKey = 'value', name, color = COLORS[0], format, horizontal = false }) {
  return (
    <Wrap title={title} subtitle={subtitle}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2ee" />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="label" width={110} {...axis} />
          <Tooltip formatter={(v) => (format ? format(v) : v)} />
          <Bar dataKey={dataKey} name={name || title} fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={48} tickFormatter={format} />
          <Tooltip formatter={(v) => (format ? format(v) : v)} />
          <Bar dataKey={dataKey} name={name || title} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </Wrap>
  );
}

// series: [{ key, name, color }]
export function LineCard({ title, subtitle, data, series, format }) {
  return (
    <Wrap title={title} subtitle={subtitle}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={48} tickFormatter={format} allowDecimals={false} />
        <Tooltip formatter={(v) => (format ? format(v) : v)} />
        {series.length > 1 && <Legend />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || COLORS[i]} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </Wrap>
  );
}

export function AreaCard({ title, subtitle, data, dataKey = 'value', name, color = COLORS[0], format }) {
  const id = `g${title.replace(/\W/g, '')}`;
  return (
    <Wrap title={title} subtitle={subtitle}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ee" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={48} tickFormatter={format} />
        <Tooltip formatter={(v) => (format ? format(v) : v)} />
        <Area type="monotone" dataKey={dataKey} name={name || title} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </Wrap>
  );
}

export function PieCard({ title, subtitle, data, format }) {
  return (
    <Wrap title={title} subtitle={subtitle}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => (format ? format(v) : v)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </Wrap>
  );
}
