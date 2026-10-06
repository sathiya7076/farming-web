import { Clock, IndianRupee, Percent, Wallet, CalendarDays } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { AreaCard, BarCard } from '../../components/Charts.jsx';
import { money } from '../../utils/format.js';

export default function Earnings() {
  const { data: e, loading, error, reload } = useFetch('/farmers/me/earnings');
  return (
    <div>
      <PageHeader title="Earnings" subtitle="What you take home after the platform commission" />
      <QueryBoundary loading={loading} error={error} reload={reload}>
        {e && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard icon={IndianRupee} label="Gross sales" value={money(e.gross)} tone="earth" />
              <StatCard icon={Percent} label={`Commission (${e.feePercent}%)`} value={money(e.commission)} tone="red" />
              <StatCard icon={Wallet} label="Net earnings" value={money(e.net)} />
              <StatCard icon={Clock} label="In progress" value={money(e.pendingNet)} tone="amber" hint="Accepted, processing or shipped" />
              <StatCard icon={CalendarDays} label="This month" value={money(e.thisMonthNet)} tone="blue" />
            </div>
            <AreaCard title="Net earnings by month" subtitle="Last 12 months" data={e.monthly.map((m) => ({ label: m.label, value: m.net }))} name="Net earnings" format={(v) => `₹${v}`} />
            {e.byProduct.length > 0 && (
              <BarCard title="Top products by revenue" data={e.byProduct.map((p) => ({ label: p._id, value: p.revenue }))} horizontal color="#a97847" name="Revenue" format={(v) => `₹${v}`} />
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
