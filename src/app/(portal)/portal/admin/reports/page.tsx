'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface Report {
  range: { from: string; to: string };
  revenueCents: number;
  paymentCount: number;
  completedJobs: number;
  jobsCreated: number;
  quotesCreated: number;
  convertedQuotes: number;
  conversionRateBps: number;
  avgTicketCents: number;
  topServices: { slug: string; count: number }[];
  daily: { date: string; revenueCents: number }[];
}

const $ = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'YTD', days: -1 },
];

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    const to = new Date();
    let from: Date;
    if (activeRange === -1) {
      from = new Date(to.getFullYear(), 0, 1);
    } else {
      from = new Date(to.getTime() - activeRange * 24 * 60 * 60 * 1000);
    }
    (async () => {
      const res = await api.get<Report>(`/api/admin/reports?from=${from.toISOString()}&to=${to.toISOString()}`);
      if (res.ok) setReport(res.data);
      setLoading(false);
    })();
  }, [activeRange]);

  if (loading || !report) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Reports</h1>
          <p className="text-rpm-silver mt-1">Performance for the selected window.</p>
        </div>
        <div className="flex items-center gap-1 bg-rpm-charcoal rounded-lg p-1 border border-rpm-gray/40">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setActiveRange(r.days)}
              className={
                'px-3 py-1.5 rounded-md text-xs font-bold transition ' +
                (activeRange === r.days ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white')
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Revenue" value={$(report.revenueCents)} />
        <Stat label="Jobs Completed" value={String(report.completedJobs)} />
        <Stat label="Avg Ticket" value={$(report.avgTicketCents)} />
        <Stat label="Quote → Job" value={`${(report.conversionRateBps / 100).toFixed(1)}%`} subtitle={`${report.convertedQuotes}/${report.quotesCreated}`} />
      </div>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-4">Daily revenue</h2>
        <RevenueChart data={report.daily} />
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-3">Top services</h2>
        {report.topServices.length === 0 ? (
          <div className="text-sm text-rpm-silver/70 italic">No service data in this range.</div>
        ) : (
          <ul className="space-y-2">
            {report.topServices.map((s) => (
              <li key={s.slug} className="flex items-center justify-between gap-3">
                <span className="text-sm text-rpm-white capitalize">{s.slug.replace(/-/g, ' ')}</span>
                <span className="text-sm text-rpm-silver tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4">
      <div className="text-[10px] uppercase tracking-wider text-rpm-silver">{label}</div>
      <div className="text-2xl font-black text-rpm-white tabular-nums mt-1">{value}</div>
      {subtitle && <div className="text-xs text-rpm-silver mt-0.5">{subtitle}</div>}
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; revenueCents: number }[] }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.revenueCents)), [data]);
  if (data.length === 0) return <div className="text-sm text-rpm-silver/70">No data</div>;
  const w = 720;
  const h = 180;
  const barW = Math.max(2, w / data.length - 2);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="w-full" role="img" aria-label="Daily revenue">
        {data.map((d, i) => {
          const x = i * (w / data.length);
          const barH = (d.revenueCents / max) * h;
          const y = h - barH;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} fill="#dc2626" rx={2} opacity={d.revenueCents > 0 ? 1 : 0.1} />
              {(i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                <text x={x + barW / 2} y={h + 14} fontSize={9} fill="#9ca3af" textAnchor="middle">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
