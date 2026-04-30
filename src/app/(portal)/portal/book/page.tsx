'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PricingTier { sizeTier: string; price: number }
interface ServicePackage {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string | null;
  basePrice: number;
  defaultDurationMinutes: number;
  pricing: PricingTier[];
}
interface Category {
  id: string;
  slug: string;
  name: string;
  packages: ServicePackage[];
}
interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }

export default function BookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [vehicleId, setVehicleId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [catRes, vehRes] = await Promise.all([
        api.get<{ categories: Category[] }>('/api/catalog'),
        api.get<{ vehicles: Vehicle[] }>('/api/portal/vehicles'),
      ]);
      if (catRes.ok) setCategories(catRes.data?.categories ?? []);
      if (vehRes.ok) {
        const list = vehRes.data?.vehicles ?? [];
        setVehicles(list);
        if (list[0]) setVehicleId(list[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const selectedPackages = useMemo(
    () => categories.flatMap((c) => c.packages).filter((p) => selectedSlugs.has(p.slug)),
    [categories, selectedSlugs]
  );

  const totalPrice = selectedPackages.reduce((s, p) => s + p.basePrice, 0);
  const totalDuration = selectedPackages.reduce((s, p) => s + p.defaultDurationMinutes, 0);

  const submit = async () => {
    if (!vehicleId || selectedSlugs.size === 0 || !date) return;
    setSubmitting(true);
    const start = new Date(`${date}T${time}:00`);
    const res = await api.post('/api/portal/bookings', {
      vehicleId,
      packageSlugs: Array.from(selectedSlugs),
      scheduledStartAt: start.toISOString(),
      durationMinutes: totalDuration,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      alert(res.error || 'Booking failed');
      return;
    }
    router.push('/portal/jobs');
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Book a service</h1>
        <p className="text-rpm-silver mt-1">Pick what you need and when, and we&apos;ll confirm the time.</p>
      </header>

      <section>
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-3">Services</h2>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h3 className="text-sm font-bold text-rpm-white mb-2">{cat.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cat.packages.map((p) => {
                  const selected = selectedSlugs.has(p.slug);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedSlugs);
                        if (selected) next.delete(p.slug); else next.add(p.slug);
                        setSelectedSlugs(next);
                      }}
                      className={cn(
                        'rounded-lg p-3 text-left border transition',
                        selected ? 'bg-rpm-red/10 border-rpm-red text-rpm-white' : 'bg-rpm-charcoal border-rpm-gray text-rpm-silver hover:border-rpm-silver/60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm font-bold">From ${p.basePrice}</div>
                      </div>
                      {p.shortDesc && <div className="text-xs opacity-80 mt-1">{p.shortDesc}</div>}
                      <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">{Math.round(p.defaultDurationMinutes / 60 * 10) / 10}h</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">Vehicle</h2>
          {vehicles.length === 0 ? (
            <div className="text-sm text-rpm-silver/70">No vehicles on file. Submit a quote first to add one.</div>
          ) : (
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} {v.trim ?? ''}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">When</h2>
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">Notes (optional)</h2>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything we should know? Specific concerns, drop-off time, etc."
          className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none"
        />
      </section>

      <footer className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-rpm-silver">Estimated total</div>
          <div className="text-2xl font-black text-rpm-white tabular-nums">${totalPrice.toLocaleString()}</div>
          <div className="text-xs text-rpm-silver">{totalDuration > 0 ? `${Math.round(totalDuration / 60 * 10) / 10}h` : 'pick a service'}</div>
        </div>
        <button
          onClick={submit}
          disabled={submitting || !vehicleId || selectedSlugs.size === 0 || !date}
          className="px-5 py-3 rounded-lg bg-rpm-red text-white font-bold hover:bg-rpm-red-dark disabled:opacity-50 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </footer>
    </div>
  );
}
