'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Play, Pause, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import JobPhotoUploader from '@/components/portal/JobPhotoUploader';

interface Bay { id: string; name: string }
interface Technician { id: string; name: string; initials?: string | null }
interface Vehicle { year: number; make: string; model: string; trim?: string | null }
interface Job {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  durationMinutes?: number | null;
  bayId?: string | null;
  technicianId?: string | null;
  user: { name: string; email: string };
  vehicle: Vehicle;
  bay?: Bay | null;
  technician?: Technician | null;
}

const isToday = (iso?: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—';

export default function BayPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [techFilter, setTechFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [overview, techsRes] = await Promise.all([
      api.get<{ jobs: Job[] }>('/api/admin/overview'),
      api.get<{ technicians: Technician[] }>('/api/admin/technicians'),
    ]);
    if (overview.ok) setJobs(overview.data?.jobs ?? []);
    if (techsRes.ok) setTechs(techsRes.data?.technicians ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const todayJobs = useMemo(() => {
    return jobs
      .filter((j) => isToday(j.scheduledStartAt) && (j.status === 'scheduled' || j.status === 'in_progress' || j.status === 'completed'))
      .filter((j) => techFilter === 'all' || j.technicianId === techFilter)
      .sort((a, b) => (a.scheduledStartAt || '').localeCompare(b.scheduledStartAt || ''));
  }, [jobs, techFilter]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-rpm-white">Bay</h1>
        <p className="text-rpm-silver mt-0.5 text-sm">Today on the floor.</p>
      </header>

      <div className="flex items-center gap-1 bg-rpm-charcoal rounded-lg p-1 border border-rpm-gray/40 overflow-x-auto">
        <button onClick={() => setTechFilter('all')} className={cn('px-3 py-1.5 rounded-md text-xs font-bold', techFilter === 'all' ? 'bg-rpm-red text-white' : 'text-rpm-silver')}>All</button>
        {techs.map((t) => (
          <button key={t.id} onClick={() => setTechFilter(t.id)} className={cn('px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap', techFilter === t.id ? 'bg-rpm-red text-white' : 'text-rpm-silver')}>
            {t.name}
          </button>
        ))}
      </div>

      {todayJobs.length === 0 && (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm text-center">
          No jobs on the schedule today.
        </div>
      )}

      <div className="space-y-3">
        {todayJobs.map((j) => (
          <BayCard key={j.id} job={j} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function BayCard({ job, onChange }: { job: Job; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [showCam, setShowCam] = useState(false);

  const advance = async (next: 'in_progress' | 'completed') => {
    setBusy(true);
    await api.patch(`/api/admin/jobs/${job.id}/status`, { status: next });
    setBusy(false);
    onChange();
  };

  const pause = async () => {
    setBusy(true);
    await api.patch(`/api/admin/jobs/${job.id}/status`, { status: 'scheduled' });
    setBusy(false);
    onChange();
  };

  const isWorking = job.status === 'in_progress';
  const isDone = job.status === 'completed';

  return (
    <div className={cn('rounded-2xl border p-4', isWorking ? 'border-amber-500/50 bg-amber-500/[0.04]' : isDone ? 'border-emerald-500/40 bg-emerald-500/[0.04]' : 'border-rpm-gray/40 bg-rpm-dark')}>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-base font-black text-rpm-white">
            {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
          </div>
          <div className="text-xs text-rpm-silver mt-0.5">
            {fmtTime(job.scheduledStartAt)}{job.scheduledEndAt && ` → ${fmtTime(job.scheduledEndAt)}`}
            {job.bay && ` · ${job.bay.name}`}
            {job.technician && ` · ${job.technician.initials ?? job.technician.name}`}
          </div>
          <div className="text-xs text-rpm-silver/80 mt-1">{job.user.name} · {job.services.join(', ')}</div>
        </div>
        <div className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
          isDone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : isWorking ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-rpm-gray/15 text-rpm-silver border-rpm-gray/40')}>
          {job.status.replace('_', ' ')}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {!isWorking && !isDone && (
          <button onClick={() => advance('in_progress')} disabled={busy} className="col-span-3 px-4 py-3 rounded-xl bg-rpm-red text-white font-bold hover:bg-rpm-red-dark disabled:opacity-50 flex items-center justify-center gap-2 text-base">
            <Play className="w-5 h-5" />
            Start work
          </button>
        )}
        {isWorking && (
          <>
            <button onClick={pause} disabled={busy} className="col-span-1 px-3 py-3 rounded-xl border border-rpm-gray text-rpm-silver hover:text-rpm-white disabled:opacity-50 flex items-center justify-center gap-1 text-sm">
              <Pause className="w-4 h-4" /> Pause
            </button>
            <button onClick={() => advance('completed')} disabled={busy} className="col-span-2 px-3 py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Done
            </button>
          </>
        )}
        {isDone && (
          <div className="col-span-3 text-center text-sm text-emerald-400 font-semibold py-2">
            Completed. Customer will be notified on pickup.
          </div>
        )}
      </div>

      <button onClick={() => setShowCam(!showCam)} className="w-full px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center justify-center gap-2">
        <Camera className="w-4 h-4" />
        {showCam ? 'Hide upload' : 'Upload photos'}
      </button>
      {showCam && (
        <div className="mt-2">
          <JobPhotoUploader jobId={job.id} onUploaded={onChange} />
        </div>
      )}
    </div>
  );
}
