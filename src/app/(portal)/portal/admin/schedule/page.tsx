'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserRef { id: string; email: string; name: string }
interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }
interface Job {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  scheduledAt?: string | null;
  user: UserRef;
  vehicle: Vehicle;
}

const startOfWeek = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
};

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ jobs: Job[] }>('/api/admin/overview');
    if (!res.ok) setErr(res.error || 'Failed to load');
    // Overview returns 50 most recent jobs — fine for the schedule view in practice.
    else setJobs((res.data as { jobs: Job[] } | null)?.jobs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const d of days) map.set(d.toDateString(), []);
    const unscheduled: Job[] = [];
    for (const j of jobs) {
      if (j.status === 'cancelled' || j.status === 'picked_up') continue;
      if (!j.scheduledAt) {
        unscheduled.push(j);
        continue;
      }
      const sd = new Date(j.scheduledAt);
      const key = days.find((d) => isSameDay(d, sd))?.toDateString();
      if (key) map.get(key)!.push(j);
    }
    return { byDay: map, unscheduled };
  }, [days, jobs]);

  const reschedule = async (jobId: string, when: Date | null) => {
    const res = await api.patch(`/api/admin/jobs/${jobId}/schedule`, {
      scheduledAt: when ? when.toISOString() : null,
    });
    if (!res.ok) {
      alert(res.error || 'Failed to reschedule');
      return;
    }
    load();
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  const weekLabel = `${fmtDay(days[0])} — ${fmtDay(days[6])}`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Schedule</h1>
          <p className="text-rpm-silver mt-1">Drag jobs onto a day, or click a job to reschedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => { const c = new Date(w); c.setDate(c.getDate() - 7); return c; })}
            className="p-2 rounded-lg border border-rpm-gray text-rpm-silver hover:text-rpm-white"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-lg border border-rpm-gray text-sm font-semibold text-rpm-silver hover:text-rpm-white"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekStart((w) => { const c = new Date(w); c.setDate(c.getDate() + 7); return c; })}
            className="p-2 rounded-lg border border-rpm-gray text-rpm-silver hover:text-rpm-white"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm text-rpm-silver/80 ml-2">{weekLabel}</span>
        </div>
      </header>

      {jobsByDay.unscheduled.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-3">
            Unscheduled ({jobsByDay.unscheduled.length}) — drop into a day
          </h3>
          <div className="flex gap-2 flex-wrap">
            {jobsByDay.unscheduled.map((j) => (
              <DragJob key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((d) => (
          <DayColumn
            key={d.toISOString()}
            date={d}
            jobs={jobsByDay.byDay.get(d.toDateString()) ?? []}
            onDrop={(jobId) => {
              const at = new Date(d);
              at.setHours(9, 0, 0, 0); // default morning slot
              reschedule(jobId, at);
            }}
            onClear={(jobId) => reschedule(jobId, null)}
          />
        ))}
      </div>
    </div>
  );
}

function DragJob({ job }: { job: Job }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', job.id)}
      className="cursor-move px-2.5 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray/50 hover:border-rpm-red/50 transition"
    >
      <div className="text-xs font-semibold text-rpm-white">
        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
      </div>
      <div className="text-[10px] text-rpm-silver">{job.user.name} · {job.services.join(', ')}</div>
    </div>
  );
}

function DayColumn({
  date, jobs, onDrop, onClear,
}: {
  date: Date;
  jobs: Job[];
  onDrop: (jobId: string) => void;
  onClear: (jobId: string) => void;
}) {
  const today = isSameDay(date, new Date());
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const jobId = e.dataTransfer.getData('text/plain');
        if (jobId) onDrop(jobId);
      }}
      className={cn(
        'rounded-xl border min-h-[180px] p-2 transition',
        today ? 'border-rpm-red/50 bg-rpm-red/[0.03]' : 'border-rpm-gray/40 bg-rpm-dark',
        over && 'border-rpm-red bg-rpm-red/10'
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-rpm-silver mb-2 flex items-center justify-between">
        <span className={cn(today && 'text-rpm-red font-bold')}>{fmtDay(date)}</span>
        <span className="tabular-nums">{jobs.length}</span>
      </div>
      <div className="space-y-1.5">
        {jobs.map((j) => (
          <div
            key={j.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', j.id)}
            className="rounded-lg bg-rpm-charcoal/70 border border-rpm-gray/40 p-2 cursor-move group"
          >
            <div className="text-xs font-semibold text-rpm-white">
              {j.vehicle.year} {j.vehicle.make} {j.vehicle.model}
            </div>
            <div className="text-[10px] text-rpm-silver mt-0.5">{j.user.name}</div>
            <div className="text-[10px] text-rpm-silver/70 mt-0.5">{j.services.join(', ')}</div>
            <button
              onClick={() => onClear(j.id)}
              className="opacity-0 group-hover:opacity-100 transition text-[10px] text-rpm-silver hover:text-rpm-red mt-1"
            >
              Clear schedule
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
