'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import CountUp from '@/components/portal/CountUp';

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

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <Stat label="Revenue" value={report.revenueCents} format={(n) => `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <Stat label="Jobs Completed" value={report.completedJobs} />
        <Stat label="Avg Ticket" value={report.avgTicketCents} format={(n) => `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <Stat label="Quote → Job" value={report.conversionRateBps} format={(n) => `${(n / 100).toFixed(1)}%`} subtitle={`${report.convertedQuotes}/${report.quotesCreated}`} />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5"
      >
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-4">Daily revenue</h2>
        <RevenueChart data={report.daily} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5"
      >
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-3">Top services</h2>
        {report.topServices.length === 0 ? (
          <div className="text-sm text-rpm-silver/70 italic">No service data in this range.</div>
        ) : (
          <ul className="space-y-2">
            {report.topServices.map((s, i) => {
              const max = report.topServices[0].count;
              return (
                <li key={s.slug} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-rpm-white capitalize truncate">{s.slug.replace(/-/g, ' ')}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-rpm-gray/30 overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: s.count / max }}
                        transition={{ duration: 0.7, delay: 0.25 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full bg-rpm-red"
                      />
                    </div>
                  </div>
                  <span className="text-sm text-rpm-silver tabular-nums w-8 text-right">{s.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}

function Stat({ label, value, format, subtitle }: { label: string; value: number; format?: (n: number) => string; subtitle?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4"
    >
      <div className="text-[10px] uppercase tracking-wider text-rpm-silver">{label}</div>
      <div className="text-2xl font-black text-rpm-white tabular-nums mt-1">
        <CountUp value={value} format={format ?? ((n) => Math.round(n).toLocaleString())} />
      </div>
      {subtitle && <div className="text-xs text-rpm-silver mt-0.5">{subtitle}</div>}
    </motion.div>
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
              <motion.rect
                x={x}
                width={barW}
                fill="#dc2626"
                rx={2}
                opacity={d.revenueCents > 0 ? 1 : 0.1}
                initial={{ y: h, height: 0 }}
                animate={{ y, height: barH }}
                transition={{ duration: 0.55, delay: i * 0.012, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
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
