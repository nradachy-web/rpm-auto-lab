'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';

interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null; color?: string | null }
interface JobEvent { id: string; toStatus: string; note?: string | null; at: string }
interface Job {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  vehicle: Vehicle;
  events: JobEvent[];
  photos: JobPhoto[];
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  pickedUpAt?: string | null;
  adminNote?: string | null;
  updatedAt: string;
}

const STEPS: Job['status'][] = ['scheduled', 'in_progress', 'completed', 'picked_up'];
const FILTERS: Array<'all' | Job['status']> = ['all', 'scheduled', 'in_progress', 'completed', 'picked_up'];

const label = (s: string) => {
  switch (s) {
    case 'in_progress': return 'In Progress';
    case 'picked_up': return 'Picked Up';
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rebookingId, setRebookingId] = useState<string | null>(null);

  const rebook = async (job: Job) => {
    if (!window.confirm(`Book another ${job.services.join(' + ')} for your ${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}?`)) return;
    setRebookingId(job.id);
    const res = await api.post<{ ok: boolean; quoteId: string }>('/api/portal/quotes/rebook', {
      jobId: job.id,
      vehicleId: job.vehicle.id,
      services: job.services,
    });
    setRebookingId(null);
    if (!res.ok) {
      alert(res.error || 'Could not create new quote');
      return;
    }
    router.push('/portal/quotes');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ jobs: Job[] }>('/api/portal/jobs');
      if (cancelled) return;
      if (!res.ok) setErr(res.error || 'Failed to load');
      else setJobs(res.data?.jobs ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">My Jobs</h1>
        <p className="text-rpm-silver mt-1">Track your vehicle service progress in real time.</p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              filter === f ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white hover:bg-rpm-charcoal'
            )}
          >
            {f === 'all' ? 'All' : label(f)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No jobs to show.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => {
            const currentIdx = STEPS.indexOf(job.status as Job['status']);
            return (
              <div key={job.id} className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-black text-rpm-white">
                      {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                    </div>
                    <div className="text-sm text-rpm-silver mt-0.5">{job.services.join(' + ')}</div>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full',
                      job.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : job.status === 'in_progress'
                        ? 'bg-m-blue/10 text-m-blue border border-m-blue/30'
                        : job.status === 'picked_up'
                        ? 'bg-rpm-gray/20 text-rpm-silver border border-rpm-gray/40'
                        : job.status === 'cancelled'
                        ? 'bg-rpm-red/10 text-rpm-red border border-rpm-red/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    )}
                  >
                    • {label(job.status)}
                  </span>
                </div>

                {/* Progress bar */}
                {job.status !== 'cancelled' && (
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {STEPS.map((s, i) => (
                      <div
                        key={s}
                        className={cn(
                          'h-1.5 rounded-full transition-colors',
                          i <= currentIdx ? 'bg-rpm-red' : 'bg-rpm-gray/40'
                        )}
                      />
                    ))}
                  </div>
                )}
                {job.status !== 'cancelled' && (
                  <div className="grid grid-cols-4 gap-1 text-[10px] uppercase tracking-wider">
                    {STEPS.map((s, i) => (
                      <div
                        key={s}
                        className={cn(
                          'text-center',
                          i <= currentIdx ? 'text-rpm-red font-semibold' : 'text-rpm-silver/60'
                        )}
                      >
                        {label(s)}
                      </div>
                    ))}
                  </div>
                )}

                {job.adminNote && (
                  <div className="mt-3 text-sm text-rpm-silver italic">
                    Note from the shop: {job.adminNote}
                  </div>
                )}

                {(job.status === 'completed' || job.status === 'picked_up') && (
                  <div className="mt-3">
                    <button
                      onClick={() => rebook(job)}
                      disabled={rebookingId === job.id}
                      className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50"
                    >
                      {rebookingId === job.id ? 'Submitting…' : 'Book again'}
                    </button>
                  </div>
                )}

                {job.photos.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs uppercase tracking-wider text-rpm-silver mb-2">
                      Photos ({job.photos.length})
                    </h4>
                    <PhotoGallery photos={job.photos} />
                  </div>
                )}

                {job.events.length > 0 && (
                  <details className="mt-3 text-xs text-rpm-silver">
                    <summary className="cursor-pointer hover:text-rpm-white">History ({job.events.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {job.events.map((e) => (
                        <li key={e.id} className="flex items-center gap-2">
                          <span className="text-rpm-red">•</span>
                          <span>{label(e.toStatus)}</span>
                          <span className="text-rpm-silver/60">— {new Date(e.at).toLocaleString()}</span>
                          {e.note && <span className="text-rpm-silver/80 italic">&quot;{e.note}&quot;</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
