'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserRef { id: string; email: string; name: string }
interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }
interface Bay { id: string; name: string; active: boolean }
interface Technician { id: string; name: string; initials?: string | null; active: boolean }
interface Job {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  scheduledAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  durationMinutes?: number | null;
  bayId?: string | null;
  technicianId?: string | null;
  bay?: Bay | null;
  technician?: Technician | null;
  user: UserRef;
  vehicle: Vehicle;
}

const HOUR_START = 8;   // 8 AM
const HOUR_END = 19;    // 7 PM
const HOUR_HEIGHT = 56; // px per hour

const startOfWeek = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
};
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
const fmtFullDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const fmtHour = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${period}`;
};
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—';
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function jobMinutes(j: Job): { start: Date | null; durationMin: number; endMin: number; startMin: number } {
  const startStr = j.scheduledStartAt || j.scheduledAt;
  if (!startStr) return { start: null, durationMin: 120, endMin: 0, startMin: 0 };
  const start = new Date(startStr);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const dur = j.durationMinutes || 120;
  return { start, durationMin: dur, endMin: startMin + dur, startMin };
}

export default function SchedulePage() {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bays, setBays] = useState<Bay[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [overview, baysRes, techsRes] = await Promise.all([
      api.get<{ jobs: Job[] }>('/api/admin/overview'),
      api.get<{ bays: Bay[] }>('/api/admin/bays'),
      api.get<{ technicians: Technician[] }>('/api/admin/technicians'),
    ]);
    if (overview.ok) setJobs(overview.data?.jobs ?? []);
    if (baysRes.ok) setBays(baysRes.data?.bays ?? []);
    if (techsRes.ok) setTechs(techsRes.data?.technicians ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => {
    if (view === 'day') return [startOfDay(anchor)];
    const wk = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(wk);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [view, anchor]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const d of days) map.set(d.toDateString(), []);
    const unscheduled: Job[] = [];
    for (const j of jobs) {
      if (j.status === 'cancelled' || j.status === 'picked_up') continue;
      const startStr = j.scheduledStartAt || j.scheduledAt;
      if (!startStr) {
        unscheduled.push(j);
        continue;
      }
      const sd = new Date(startStr);
      const key = days.find((d) => sameDay(d, sd))?.toDateString();
      if (key) map.get(key)!.push(j);
    }
    return { byDay: map, unscheduled };
  }, [days, jobs]);

  const updateSchedule = async (jobId: string, body: Record<string, unknown>) => {
    const res = await api.patch(`/api/admin/jobs/${jobId}/schedule`, body);
    if (!res.ok) {
      alert(res.error || 'Failed to update');
      return false;
    }
    load();
    return true;
  };

  const dropOnSlot = (jobId: string, day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const job = jobs.find((j) => j.id === jobId);
    const duration = job?.durationMinutes || 120;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    updateSchedule(jobId, {
      scheduledStartAt: start.toISOString(),
      scheduledEndAt: end.toISOString(),
      durationMinutes: duration,
    });
  };

  const navigate = (direction: 1 | -1) => {
    const next = new Date(anchor);
    if (view === 'day') next.setDate(next.getDate() + direction);
    else next.setDate(next.getDate() + 7 * direction);
    setAnchor(next);
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  const headerLabel = view === 'day'
    ? fmtFullDay(days[0])
    : `${fmtDay(days[0])} — ${fmtDay(days[6])}`;

  const activeBays = bays.filter((b) => b.active);
  const activeTechs = techs.filter((t) => t.active);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Schedule</h1>
          <p className="text-rpm-silver mt-1 text-sm">{headerLabel} · click any open slot or drag from below.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-rpm-charcoal rounded-lg p-1 border border-rpm-gray/40">
            <button onClick={() => setView('day')} className={cn('px-3 py-1.5 rounded-md text-xs font-bold', view === 'day' ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white')}>Day</button>
            <button onClick={() => setView('week')} className={cn('px-3 py-1.5 rounded-md text-xs font-bold', view === 'week' ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white')}>Week</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-rpm-gray text-rpm-silver hover:text-rpm-white" aria-label="Previous">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setAnchor(new Date())} className="px-3 py-1.5 rounded-lg border border-rpm-gray text-xs font-bold text-rpm-silver hover:text-rpm-white">
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-rpm-gray text-rpm-silver hover:text-rpm-white" aria-label="Next">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link href="/portal/admin/new-quote" className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New job
          </Link>
        </div>
      </header>

      {jobsByDay.unscheduled.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <h3 className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-2">
            Unscheduled ({jobsByDay.unscheduled.length}) — drag onto a slot
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {jobsByDay.unscheduled.map((j) => (
              <button
                key={j.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', j.id)}
                onClick={() => setEditingJob(j)}
                className="cursor-move px-2 py-1 rounded-md bg-rpm-charcoal border border-rpm-gray/50 hover:border-rpm-red/50 text-xs text-left"
              >
                <span className="text-rpm-white font-semibold">{j.vehicle.year} {j.vehicle.make} {j.vehicle.model}</span>
                <span className="text-rpm-silver"> · {j.user.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <TimeGrid
        days={days}
        jobsByDay={jobsByDay.byDay}
        onDrop={dropOnSlot}
        onClickEmpty={(day, hour) => {
          const start = new Date(day);
          start.setHours(hour, 0, 0, 0);
          // Open editor with no job — direct user to create one via new-quote.
          window.location.href = `/portal/admin/new-quote?date=${start.toISOString().slice(0, 10)}&time=${String(hour).padStart(2, '0')}:00`;
        }}
        onClickJob={setEditingJob}
      />

      {editingJob && (
        <ScheduleModal
          job={editingJob}
          bays={activeBays}
          techs={activeTechs}
          onSave={async (body) => {
            const ok = await updateSchedule(editingJob.id, body);
            if (ok) setEditingJob(null);
          }}
          onClose={() => setEditingJob(null)}
        />
      )}
    </div>
  );
}

function TimeGrid({
  days, jobsByDay, onDrop, onClickEmpty, onClickJob,
}: {
  days: Date[];
  jobsByDay: Map<string, Job[]>;
  onDrop: (jobId: string, day: Date, hour: number) => void;
  onClickEmpty: (day: Date, hour: number) => void;
  onClickJob: (j: Job) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const totalH = (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT;
  const today = new Date();
  const nowMin = today.getHours() * 60 + today.getMinutes();

  return (
    <div className="rounded-xl border border-rpm-gray/40 bg-rpm-dark overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid sticky top-0 bg-rpm-charcoal/90 backdrop-blur z-10 border-b border-rpm-gray/40" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
          <div />
          {days.map((d) => (
            <div key={d.toDateString()} className={cn('px-2 py-2 text-center text-[11px] uppercase tracking-wider font-bold border-l border-rpm-gray/30', sameDay(d, today) ? 'text-rpm-red' : 'text-rpm-silver')}>
              {fmtDay(d)}
            </div>
          ))}
        </div>
        <div className="grid relative" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)`, height: totalH }}>
          {/* Hour gutter */}
          <div className="border-r border-rpm-gray/30">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-rpm-silver/70 px-1.5 pt-0.5">
                {fmtHour(h)}
              </div>
            ))}
          </div>
          {/* Day columns */}
          {days.map((d) => {
            const dayJobs = jobsByDay.get(d.toDateString()) ?? [];
            const isToday = sameDay(d, today);
            return (
              <DayColumn
                key={d.toDateString()}
                day={d}
                jobs={dayJobs}
                hours={hours}
                isToday={isToday}
                nowMin={isToday ? nowMin : null}
                onDrop={(jobId, hour) => onDrop(jobId, d, hour)}
                onClickEmpty={(hour) => onClickEmpty(d, hour)}
                onClickJob={onClickJob}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day, jobs, hours, isToday, nowMin, onDrop, onClickEmpty, onClickJob,
}: {
  day: Date;
  jobs: Job[];
  hours: number[];
  isToday: boolean;
  nowMin: number | null;
  onDrop: (jobId: string, hour: number) => void;
  onClickEmpty: (hour: number) => void;
  onClickJob: (j: Job) => void;
}) {
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const colHeight = (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT;

  return (
    <div className={cn('relative border-l border-rpm-gray/30', isToday && 'bg-rpm-red/[0.02]')} style={{ height: colHeight }}>
      {/* Hour slots */}
      {hours.map((h) => (
        <div
          key={h}
          style={{ height: HOUR_HEIGHT }}
          className={cn('border-b border-rpm-gray/20 cursor-pointer transition-colors', hoverHour === h && 'bg-rpm-red/10')}
          onDragOver={(e) => { e.preventDefault(); setHoverHour(h); }}
          onDragLeave={() => setHoverHour(null)}
          onDrop={(e) => {
            e.preventDefault();
            setHoverHour(null);
            const id = e.dataTransfer.getData('text/plain');
            if (id) onDrop(id, h);
          }}
          onClick={() => onClickEmpty(h)}
          aria-label={`Open ${fmtHour(h)}`}
        />
      ))}

      {/* Now-line */}
      {isToday && nowMin != null && nowMin >= HOUR_START * 60 && nowMin <= (HOUR_END + 1) * 60 && (
        <div
          className="absolute left-0 right-0 border-t-2 border-rpm-red z-10 pointer-events-none"
          style={{ top: ((nowMin - HOUR_START * 60) / 60) * HOUR_HEIGHT }}
        >
          <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-rpm-red" />
        </div>
      )}

      {/* Job blocks */}
      {jobs.map((j) => {
        const m = jobMinutes(j);
        if (!m.start) return null;
        const visStart = Math.max(m.startMin, HOUR_START * 60);
        const visEnd = Math.min(m.endMin, (HOUR_END + 1) * 60);
        if (visEnd <= visStart) return null;
        const top = ((visStart - HOUR_START * 60) / 60) * HOUR_HEIGHT;
        const height = ((visEnd - visStart) / 60) * HOUR_HEIGHT;
        const statusColor =
          j.status === 'in_progress' ? 'bg-amber-500/30 border-amber-500/60'
          : j.status === 'completed' ? 'bg-emerald-500/25 border-emerald-500/60'
          : 'bg-rpm-red/25 border-rpm-red/60';
        return (
          <div
            key={j.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', j.id)}
            onClick={(e) => { e.stopPropagation(); onClickJob(j); }}
            className={cn('absolute left-1 right-1 rounded-md border px-1.5 py-1 cursor-pointer overflow-hidden text-rpm-white shadow-sm', statusColor)}
            style={{ top, height: Math.max(28, height) }}
          >
            <div className="text-[10px] uppercase tracking-wider opacity-80">{fmtTime(m.start.toISOString())}</div>
            <div className="text-[11px] font-bold leading-tight">{j.vehicle.year} {j.vehicle.make} {j.vehicle.model}</div>
            {height > 50 && <div className="text-[10px] opacity-80 truncate">{j.user.name}</div>}
            {height > 64 && <div className="text-[10px] opacity-70 truncate">{j.services.join(', ')}</div>}
            {j.bay && height > 78 && <div className="text-[10px] opacity-70 truncate">{j.bay.name}</div>}
          </div>
        );
      })}
    </div>
  );
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleModal({
  job, bays, techs, onSave, onClose,
}: {
  job: Job;
  bays: Bay[];
  techs: Technician[];
  onSave: (body: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(toLocalInput(job.scheduledStartAt || job.scheduledAt));
  const [duration, setDuration] = useState(String(job.durationMinutes || 120));
  const [bayId, setBayId] = useState(job.bayId || '');
  const [techId, setTechId] = useState(job.technicianId || '');

  const submit = () => {
    const startDate = start ? new Date(start) : null;
    const dur = Number(duration) || 120;
    const endDate = startDate ? new Date(startDate.getTime() + dur * 60 * 1000) : null;
    onSave({
      scheduledStartAt: startDate ? startDate.toISOString() : null,
      scheduledEndAt: endDate ? endDate.toISOString() : null,
      durationMinutes: dur,
      bayId: bayId || null,
      technicianId: techId || null,
    });
  };

  const clearSchedule = () => {
    onSave({ scheduledStartAt: null, scheduledEndAt: null, durationMinutes: null, bayId: null, technicianId: null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-rpm-dark border border-rpm-gray/60 rounded-xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between mb-4">
          <div>
            <div className="text-base font-black text-rpm-white">{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</div>
            <div className="text-xs text-rpm-silver">{job.user.name} · {job.services.join(', ')}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-rpm-silver hover:text-rpm-white">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="space-y-3">
          <label className="block text-xs text-rpm-silver">
            Start
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </label>
          <label className="block text-xs text-rpm-silver">
            Duration (minutes)
            <input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-rpm-silver">
              Bay
              <select value={bayId} onChange={(e) => setBayId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
                <option value="">Unassigned</option>
                {bays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-rpm-silver">
              Technician
              <select value={techId} onChange={(e) => setTechId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
                <option value="">Unassigned</option>
                {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </div>
        </div>

        <footer className="mt-5 flex items-center justify-between">
          <button onClick={clearSchedule} className="text-xs text-rpm-silver hover:text-rpm-red">Clear schedule</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
            <button onClick={submit} className="px-4 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark">Save</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
