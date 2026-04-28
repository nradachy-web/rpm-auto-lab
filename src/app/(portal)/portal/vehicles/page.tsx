'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { api } from '@/lib/api';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';
import { cn } from '@/lib/utils';

interface JobOnVehicle {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  completedAt?: string | null;
  pickedUpAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  photos: JobPhoto[];
}

interface QuoteOnVehicle {
  id: string;
  services: string[];
  status: string;
  estimatedTotal: number;
  quotedAmount?: number | null;
  submittedAt: string;
}

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  createdAt: string;
  jobs: JobOnVehicle[];
  quotes: QuoteOnVehicle[];
}

const label = (s: string) => {
  switch (s) {
    case 'in_progress': return 'In Progress';
    case 'picked_up': return 'Picked Up';
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
};

const statusPill = (status: string) =>
  status === 'completed' || status === 'picked_up'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : status === 'in_progress'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : status === 'cancelled'
    ? 'bg-rpm-red/10 text-rpm-red border-rpm-red/30'
    : 'bg-rpm-gray/15 text-rpm-silver border-rpm-gray/40';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ vehicles: Vehicle[] }>('/api/portal/vehicles');
      if (cancelled) return;
      if (!res.ok) setErr(res.error || 'Failed to load');
      else setVehicles(res.data?.vehicles ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">My Vehicles</h1>
        <p className="text-rpm-silver mt-1">
          Service history and photos for every vehicle we&apos;ve worked on.
        </p>
      </header>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No vehicles yet. Submit a{' '}
          <Link href="/contact" className="text-rpm-red hover:text-rpm-red-glow">quote</Link>{' '}
          to add one.
        </div>
      ) : (
        <div className="space-y-6">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const completedJobs = vehicle.jobs.filter((j) => j.status === 'completed' || j.status === 'picked_up');
  const activeJobs = vehicle.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');

  return (
    <div className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
      <header className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-rpm-red" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black text-rpm-white truncate">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && <span className="text-rpm-silver/70 font-normal">{vehicle.trim}</span>}
          </div>
          <div className="text-xs text-rpm-silver mt-0.5">
            {vehicle.color && <span>{vehicle.color} · </span>}
            Added {new Date(vehicle.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right text-xs uppercase tracking-wider text-rpm-silver/60">
          {vehicle.jobs.length} job{vehicle.jobs.length === 1 ? '' : 's'}
        </div>
      </header>

      {activeJobs.length > 0 && (
        <section className="mb-4">
          <h3 className="text-xs uppercase tracking-wider text-rpm-silver mb-2">In progress</h3>
          <div className="space-y-2">
            {activeJobs.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      {completedJobs.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-rpm-silver mb-2">Service history</h3>
          <div className="space-y-3">
            {completedJobs.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      {vehicle.jobs.length === 0 && (
        <div className="text-sm text-rpm-silver/60 italic">No jobs yet for this vehicle.</div>
      )}
    </div>
  );
}

function JobRow({ job }: { job: JobOnVehicle }) {
  const date = job.completedAt || job.pickedUpAt || job.scheduledAt || job.createdAt;
  return (
    <div className="rounded-lg border border-rpm-gray/40 bg-rpm-charcoal/40 p-3">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="text-sm font-semibold text-rpm-white">{job.services.join(' + ')}</div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', statusPill(job.status))}>
          {label(job.status)}
        </span>
      </div>
      <div className="text-xs text-rpm-silver/80">{new Date(date).toLocaleDateString()}</div>
      {job.photos.length > 0 && (
        <div className="mt-3">
          <PhotoGallery photos={job.photos} />
        </div>
      )}
    </div>
  );
}
