'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { api } from '@/lib/api';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  createdAt: string;
}

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
          Vehicles you&apos;ve submitted for service or quotes.
        </p>
      </header>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No vehicles yet. Submit a{' '}
          <Link href="/contact" className="text-rpm-red hover:text-rpm-red-glow">quote</Link>{' '}
          to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-rpm-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-black text-rpm-white truncate">
                    {v.year} {v.make} {v.model}
                  </div>
                  {v.trim && <div className="text-xs text-rpm-silver">{v.trim}</div>}
                </div>
              </div>
              <dl className="text-sm space-y-1.5">
                {v.color && (
                  <div className="flex justify-between">
                    <dt className="text-rpm-silver/70">Color</dt>
                    <dd className="text-rpm-white">{v.color}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-rpm-silver/70">Added</dt>
                  <dd className="text-rpm-white">{new Date(v.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
