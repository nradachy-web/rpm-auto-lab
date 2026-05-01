'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Wrench, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import PortalHero from '@/components/portal/PortalHero';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';
import EmptyState from '@/components/portal/EmptyState';

interface JobOnVehicle {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  scheduledAt?: string | null;
  completedAt?: string | null;
  pickedUpAt?: string | null;
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

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ vehicles: Vehicle[] }>('/api/portal/vehicles');
      if (res.ok) setVehicles(res.data?.vehicles ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  // Flatten across vehicles into top-level "what's happening now" and "what's pending".
  const allJobs = vehicles.flatMap((v) => v.jobs.map((j) => ({ ...j, vehicle: v })));
  const allQuotes = vehicles.flatMap((v) => v.quotes.map((q) => ({ ...q, vehicle: v })));
  const activeJobs = allJobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress' || j.status === 'completed');
  const openQuotes = allQuotes.filter((q) => q.status === 'submitted' || q.status === 'quoted');

  return (
    <div className="space-y-6">
      <PortalHero
        imageFile="customer-hero.jpg"
        eyebrow="Your garage"
        title="Vehicles, jobs, and quotes"
        subtitle="Everything you've got with us — past and present."
      />

      {activeJobs.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-rpm-white flex items-center gap-2"><Wrench className="w-4 h-4 text-rpm-red" /> Active jobs</h2>
            <Link href="/portal/jobs" className="text-xs text-rpm-red hover:text-rpm-red-glow">All jobs →</Link>
          </header>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-2"
          >
            {activeJobs.map((j) => (
              <motion.div
                key={j.id}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-rpm-white">{j.vehicle.year} {j.vehicle.make} {j.vehicle.model}</div>
                    <div className="text-xs text-rpm-silver mt-0.5">{j.services.join(' + ')}</div>
                    {j.scheduledAt && (
                      <div className="text-[11px] text-rpm-silver mt-1">{new Date(j.scheduledAt).toLocaleString()}</div>
                    )}
                  </div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', statusPill(j.status))}>
                    {label(j.status)}
                  </span>
                </div>
                {j.photos.length > 0 && (
                  <div className="mt-3"><PhotoGallery photos={j.photos} /></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {openQuotes.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-rpm-white flex items-center gap-2"><FileText className="w-4 h-4 text-rpm-red" /> Quotes</h2>
            <Link href="/portal/quotes" className="text-xs text-rpm-red hover:text-rpm-red-glow">All quotes →</Link>
          </header>
          <div className="space-y-2">
            {openQuotes.map((q) => (
              <div key={q.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rpm-white">{q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</div>
                  <div className="text-xs text-rpm-silver mt-0.5">{q.services.join(' + ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-rpm-silver">{q.quotedAmount ? 'Quoted' : 'Estimated'}</div>
                  <div className="text-lg font-black text-rpm-white tabular-nums">${(q.quotedAmount ?? q.estimatedTotal).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <header className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-rpm-white flex items-center gap-2"><Car className="w-4 h-4 text-rpm-red" /> Vehicles</h2>
        </header>
        {vehicles.length === 0 ? (
          <EmptyState
            message="No vehicles on file yet. Submit a quote to add one."
            action={<Link href="/portal/book" className="px-4 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold">Book a service</Link>}
          />
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <details key={v.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark">
                <summary className="cursor-pointer p-4 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-rpm-white">{v.year} {v.make} {v.model} {v.trim && <span className="text-rpm-silver font-normal">{v.trim}</span>}</div>
                    <div className="text-xs text-rpm-silver mt-0.5">{v.color || 'Color not set'} · {v.jobs.length} job{v.jobs.length === 1 ? '' : 's'}</div>
                  </div>
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {v.jobs.length === 0 ? (
                    <div className="text-xs text-rpm-silver/70 italic">No jobs yet.</div>
                  ) : v.jobs.map((j) => (
                    <div key={j.id} className="rounded-lg border border-rpm-gray/30 bg-rpm-charcoal/40 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-rpm-white font-semibold">{j.services.join(' + ')}</div>
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', statusPill(j.status))}>
                          {label(j.status)}
                        </span>
                      </div>
                      <div className="text-[11px] text-rpm-silver mt-1">
                        {new Date(j.completedAt || j.scheduledAt || j.createdAt).toLocaleDateString()}
                      </div>
                      {j.photos.length > 0 && <div className="mt-3"><PhotoGallery photos={j.photos} /></div>}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
