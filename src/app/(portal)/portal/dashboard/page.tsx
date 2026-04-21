'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, Wrench, FileText, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }
interface Quote { id: string; services: string[]; estimatedTotal: number; status: string; submittedAt: string; vehicle: Vehicle }
interface Job { id: string; services: string[]; status: string; vehicle: Vehicle; updatedAt: string }

interface Overview { vehicles: Vehicle[]; quotes: Quote[]; jobs: Job[] }

const statusLabel = (s: string) => {
  switch (s) {
    case 'in_progress': return 'In Progress';
    case 'picked_up': return 'Picked Up';
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
};
const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'text-emerald-400';
    case 'in_progress': return 'text-m-blue';
    case 'picked_up': return 'text-rpm-silver';
    case 'cancelled': return 'text-rpm-red';
    default: return 'text-amber-400';
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<Overview>('/api/portal/dashboard');
      if (cancelled) return;
      if (!res.ok) setErr(res.error || 'Failed to load');
      else setData(res.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;
  if (!data) return null;

  const activeJobs = data.jobs.filter((j) => j.status !== 'picked_up' && j.status !== 'cancelled');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Dashboard</h1>
        <p className="text-rpm-silver mt-1">Here&apos;s everything happening with your vehicles.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Car} label="Vehicles" value={data.vehicles.length} href="/portal/vehicles" />
        <StatCard icon={Wrench} label="Active jobs" value={activeJobs.length} href="/portal/jobs" />
        <StatCard icon={FileText} label="Quotes" value={data.quotes.length} href="/portal/quotes" />
        <StatCard icon={Clock} label="Pending" value={data.quotes.filter((q) => q.status === 'submitted').length} href="/portal/quotes" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-rpm-white">Active jobs</h2>
          <Link href="/portal/jobs" className="text-xs text-rpm-red hover:text-rpm-red-glow">View all →</Link>
        </div>
        {activeJobs.length === 0 ? (
          <EmptyState message="No active jobs. Once your quote is accepted and scheduled it'll show up here." />
        ) : (
          <div className="space-y-2">
            {activeJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rpm-white">{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</div>
                  <div className="text-xs text-rpm-silver mt-1">{job.services.join(' + ')}</div>
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${statusColor(job.status)}`}>
                  {statusLabel(job.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-rpm-white">Recent quotes</h2>
          <Link href="/portal/quotes" className="text-xs text-rpm-red hover:text-rpm-red-glow">View all →</Link>
        </div>
        {data.quotes.length === 0 ? (
          <EmptyState message="Submit a quote request to kick things off." />
        ) : (
          <div className="space-y-2">
            {data.quotes.slice(0, 5).map((q) => (
              <div key={q.id} className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rpm-white">{q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</div>
                  <div className="text-xs text-rpm-silver mt-1">{q.services.join(' + ')}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold uppercase tracking-wider ${statusColor(q.status)}`}>{statusLabel(q.status)}</div>
                  <div className="text-sm font-bold text-rpm-white mt-1">${q.estimatedTotal.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-rpm-gray/50 bg-rpm-dark hover:border-rpm-red/40 transition-colors p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-rpm-red" />
        <span className="text-xs uppercase tracking-wider text-rpm-silver">{label}</span>
      </div>
      <div className="text-2xl font-black text-rpm-white tabular-nums">{value}</div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rpm-gray/40 p-6 text-rpm-silver/70 text-sm">
      {message}
    </div>
  );
}
