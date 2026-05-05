'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Wrench, Sparkles, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';

interface Vehicle { year: number; make: string; model: string; trim?: string | null; color?: string | null }
interface JobDetail {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  scheduledAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  durationMinutes?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  pickedUpAt?: string | null;
  cureUntil?: string | null;
  cureKind?: string | null;
  vehicle: Vehicle;
  photos: JobPhoto[];
  bay?: { name: string } | null;
  technician?: { name: string; initials?: string | null } | null;
}

const STAGES: Array<{ key: JobDetail['status']; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'scheduled', label: 'Scheduled', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'completed', label: 'Ready', icon: Sparkles },
  { key: 'picked_up', label: 'Picked Up', icon: KeyRound },
];

const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export default function JobTrackerPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <JobTrackerInner />
    </Suspense>
  );
}

function JobTrackerInner() {
  const params = useSearchParams();
  const id = params?.get('id') ?? '';
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.get<{ job: JobDetail }>(`/api/portal/jobs/${id}`);
    if (res.ok && res.data) setJob(res.data.job);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = setInterval(load, 30000);
    const tick = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, [load]);

  const eta = useMemo(() => {
    if (!job) return null;
    if (job.status === 'completed' || job.status === 'picked_up') return null;
    const start = job.scheduledStartAt || job.scheduledAt;
    if (!start) return null;
    const startTs = new Date(start).getTime();
    const dur = (job.durationMinutes || 120) * 60 * 1000;
    const expectedEnd = startTs + dur;
    return expectedEnd;
  }, [job]);

  const progress = useMemo(() => {
    if (!job) return 0;
    if (job.status === 'picked_up' || job.status === 'completed') return 1;
    if (job.status === 'cancelled') return 0;
    const start = job.startedAt ? new Date(job.startedAt).getTime() : (job.scheduledStartAt ? new Date(job.scheduledStartAt).getTime() : null);
    if (!start) return 0.05;
    const dur = (job.durationMinutes || 120) * 60 * 1000;
    const elapsed = Math.max(0, now - start);
    return Math.min(0.95, elapsed / dur);
  }, [job, now]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (!id || !job) return <div className="text-rpm-red text-sm">Job not found.</div>;

  const currentStageIdx = STAGES.findIndex((s) => s.key === job.status);
  const isCancelled = job.status === 'cancelled';

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-rpm-red font-bold mb-1">Live tracker</div>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">
          {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
        </h1>
        <p className="text-rpm-silver mt-1">{job.services.join(' + ')}</p>
      </header>

      {!isCancelled && (
        <section className="rounded-2xl border border-rpm-gray/40 bg-rpm-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-rpm-silver">Estimated ready</div>
            <div className={cn('text-lg font-bold tabular-nums', job.status === 'completed' ? 'text-emerald-400' : 'text-rpm-white')}>
              {job.status === 'completed' ? 'Ready for pickup' : eta ? fmtTime(new Date(eta).toISOString()) : 'Pending schedule'}
            </div>
          </div>
          <div className="h-2 rounded-full bg-rpm-gray/30 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rpm-red to-rpm-red"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {STAGES.map((s, i) => {
              const done = currentStageIdx >= i;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center border-2', done ? 'border-rpm-red bg-rpm-red/15 text-rpm-red' : 'border-rpm-gray text-rpm-silver/60')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={cn('mt-1.5 text-[10px] uppercase tracking-wider font-bold', done ? 'text-rpm-white' : 'text-rpm-silver/60')}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(job.bay || job.technician) && (
        <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 flex items-center justify-between text-sm">
          <span className="text-rpm-silver">In the shop</span>
          <span className="text-rpm-white font-semibold">
            {job.bay?.name && <>{job.bay.name}</>}
            {job.technician && <span className="text-rpm-silver"> · with {job.technician.name}</span>}
          </span>
        </section>
      )}

      {job.cureUntil && (job.status === 'completed' || job.status === 'picked_up') && (
        <CureCountdown cureUntil={job.cureUntil} cureKind={job.cureKind} now={now} />
      )}

      {job.photos.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">
            Photos ({job.photos.length})
          </h2>
          <PhotoGallery photos={job.photos} />
        </section>
      )}

      <section className="text-[11px] text-rpm-silver/70">
        Updates every 30 seconds. Last refresh {new Date(now).toLocaleTimeString()}.
      </section>
    </div>
  );
}

function CureCountdown({ cureUntil, cureKind, now }: { cureUntil: string; cureKind?: string | null; now: number }) {
  const target = new Date(cureUntil).getTime();
  const remaining = target - now;
  const done = remaining <= 0;
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const totalH = Math.max(1, Math.floor((target - new Date(cureUntil).getTime() + remaining) / (60 * 60 * 1000)));
  const elapsedPct = Math.max(0, Math.min(100, 100 - (remaining / (totalH * 60 * 60 * 1000)) * 100));
  const headline = (() => {
    switch (cureKind) {
      case 'ppf': return done ? 'PPF cure complete — wash away.' : 'Do not wash. PPF curing.';
      case 'ceramic-coating': return done ? 'Ceramic cure complete — safe to wash.' : 'Do not wash. Ceramic coating curing.';
      case 'window-tint': return done ? 'Tint cure complete — windows safe to roll down.' : 'Do not roll windows down. Tint curing.';
      case 'vehicle-wraps': return done ? 'Wrap cure complete — wash away.' : 'Do not wash. Wrap curing.';
      default: return done ? 'Service cure complete.' : 'Service curing.';
    }
  })();
  return (
    <section className={done ? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5' : 'rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5'}>
      <div className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Cure window</div>
      <div className={'text-lg font-black mt-1 ' + (done ? 'text-emerald-400' : 'text-amber-300')}>{headline}</div>
      {!done && (
        <>
          <div className="mt-2 text-2xl font-black text-rpm-white tabular-nums">
            {days > 0 && `${days}d `}
            {hours}h remaining
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-rpm-gray/30 overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${elapsedPct}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-rpm-silver">Safe to wash after {new Date(cureUntil).toLocaleString()}.</div>
        </>
      )}
    </section>
  );
}
