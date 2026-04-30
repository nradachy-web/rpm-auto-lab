'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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

const startOfWeek = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
};
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—';
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bays, setBays] = useState<Bay[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [overview, baysRes, techsRes] = await Promise.all([
      api.get<{ jobs: Job[] }>('/api/admin/overview'),
      api.get<{ bays: Bay[] }>('/api/admin/bays'),
      api.get<{ technicians: Technician[] }>('/api/admin/technicians'),
    ]);
    if (!overview.ok) setErr(overview.error || 'Failed to load');
    else setJobs(overview.data?.jobs ?? []);
    if (baysRes.ok) setBays(baysRes.data?.bays ?? []);
    if (techsRes.ok) setTechs(techsRes.data?.technicians ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

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
      const key = days.find((d) => isSameDay(d, sd))?.toDateString();
      if (key) map.get(key)!.push(j);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const at = a.scheduledStartAt || a.scheduledAt || '';
        const bt = b.scheduledStartAt || b.scheduledAt || '';
        return at.localeCompare(bt);
      });
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

  const dropOnDay = (jobId: string, day: Date) => {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const job = jobs.find((j) => j.id === jobId);
    const duration = job?.durationMinutes || 120;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    updateSchedule(jobId, {
      scheduledStartAt: start.toISOString(),
      scheduledEndAt: end.toISOString(),
      durationMinutes: duration,
    });
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  const weekLabel = `${fmtDay(days[0])} — ${fmtDay(days[6])}`;
  const activeBays = bays.filter((b) => b.active);
  const activeTechs = techs.filter((t) => t.active);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Schedule</h1>
          <p className="text-rpm-silver mt-1">Drag onto a day to schedule. Click a job to set time, bay, and tech.</p>
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
            Unscheduled ({jobsByDay.unscheduled.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {jobsByDay.unscheduled.map((j) => (
              <DragJob key={j.id} job={j} onClick={() => setEditingJob(j)} />
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
            onDrop={(jobId) => dropOnDay(jobId, d)}
            onClickJob={(j) => setEditingJob(j)}
          />
        ))}
      </div>

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

function DragJob({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', job.id)}
      onClick={onClick}
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
  date, jobs, onDrop, onClickJob,
}: {
  date: Date;
  jobs: Job[];
  onDrop: (jobId: string) => void;
  onClickJob: (j: Job) => void;
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
        'rounded-xl border min-h-[200px] p-2 transition',
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
          <button
            key={j.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', j.id)}
            onClick={() => onClickJob(j)}
            className="w-full rounded-lg bg-rpm-charcoal/70 border border-rpm-gray/40 p-2 cursor-pointer text-left hover:border-rpm-red/50"
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-rpm-silver">
              <span>{fmtTime(j.scheduledStartAt || j.scheduledAt)}</span>
              {j.bay && <span className="text-rpm-red">{j.bay.name}</span>}
            </div>
            <div className="text-xs font-semibold text-rpm-white mt-0.5">
              {j.vehicle.year} {j.vehicle.make} {j.vehicle.model}
            </div>
            <div className="text-[10px] text-rpm-silver">{j.user.name}</div>
            <div className="text-[10px] text-rpm-silver/70 truncate">{j.services.join(', ')}</div>
            {j.technician && (
              <div className="mt-1 inline-block px-1.5 py-0.5 rounded-full bg-rpm-red/10 text-[9px] font-bold text-rpm-red">
                {j.technician.initials || j.technician.name}
              </div>
            )}
          </button>
        ))}
      </div>
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
    onSave({
      scheduledStartAt: null,
      scheduledEndAt: null,
      durationMinutes: null,
      bayId: null,
      technicianId: null,
    });
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
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
            />
          </label>
          <label className="block text-xs text-rpm-silver">
            Duration (minutes)
            <input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-rpm-silver">
              Bay
              <select
                value={bayId}
                onChange={(e) => setBayId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
              >
                <option value="">Unassigned</option>
                {bays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-rpm-silver">
              Technician
              <select
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
              >
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
