'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type SizeTier = 'compact' | 'sedan' | 'suv' | 'truck' | 'oversize';

interface ServicePricing { id: string; sizeTier: SizeTier; price: number }
interface ServicePackage {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string | null;
  longDesc?: string | null;
  basePrice: number;
  defaultDurationMinutes: number;
  active: boolean;
  sortOrder: number;
  pricing: ServicePricing[];
}
interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  packages: ServicePackage[];
}

const TIERS: SizeTier[] = ['compact', 'sedan', 'suv', 'truck', 'oversize'];

export default function CatalogPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ categories: ServiceCategory[] }>('/api/admin/catalog');
    if (!res.ok) setErr(res.error || 'Failed to load');
    else setCategories(res.data?.categories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setSeeding(true);
    await api.post('/api/admin/catalog/seed');
    setSeeding(false);
    load();
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  const isEmpty = categories.length === 0 || categories.every((c) => c.packages.length === 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Service Catalog</h1>
          <p className="text-rpm-silver mt-1">Master pricing per service and per vehicle size. Used in invoices and the schedule.</p>
        </div>
        <button
          onClick={seed}
          disabled={seeding}
          className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white disabled:opacity-50"
        >
          {seeding ? 'Seeding…' : isEmpty ? 'Seed defaults' : 'Re-sync defaults'}
        </button>
      </header>

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-6 text-rpm-silver/80 flex items-center justify-between gap-3 flex-wrap">
          <span>No catalog yet. Import the standard RPM lineup to get started.</span>
          <button onClick={seed} disabled={seeding} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">
            {seeding ? 'Seeding…' : 'Seed defaults now'}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-lg font-bold text-rpm-white mb-2">{cat.name}</h2>
            {cat.description && <p className="text-xs text-rpm-silver/80 mb-3">{cat.description}</p>}
            <div className="space-y-3">
              {cat.packages.map((p) => (
                <PackageRow key={p.id} pkg={p} onSaved={load} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PackageRow({ pkg, onSaved }: { pkg: ServicePackage; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pkg.name);
  const [basePrice, setBasePrice] = useState(String(pkg.basePrice));
  const [duration, setDuration] = useState(String(pkg.defaultDurationMinutes));
  const [active, setActive] = useState(pkg.active);
  const [pricing, setPricing] = useState<Record<SizeTier, string>>(() => {
    const map: Record<SizeTier, string> = { compact: '', sedan: '', suv: '', truck: '', oversize: '' };
    for (const t of pkg.pricing) map[t.sizeTier] = String(t.price);
    return map;
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const tierEntries: { sizeTier: SizeTier; price: number }[] = [];
    for (const t of TIERS) {
      const v = Number(pricing[t]);
      if (Number.isFinite(v) && v > 0) tierEntries.push({ sizeTier: t, price: Math.round(v) });
    }
    const res = await api.patch(`/api/admin/catalog/packages/${pkg.id}`, {
      name,
      basePrice: Math.round(Number(basePrice)) || 0,
      defaultDurationMinutes: Math.round(Number(duration)) || 60,
      active,
      pricing: tierEntries,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Save failed');
      return;
    }
    setEditing(false);
    onSaved();
  };

  return (
    <div className={cn(
      'rounded-xl border p-4',
      pkg.active ? 'border-rpm-gray/50 bg-rpm-dark' : 'border-rpm-gray/30 bg-rpm-dark/50 opacity-70'
    )}>
      {!editing ? (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold text-rpm-white">{pkg.name}</div>
            <div className="text-xs text-rpm-silver/80 truncate">{pkg.shortDesc}</div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-rpm-silver">Base ${pkg.basePrice}</span>
              <span className="text-[11px] uppercase tracking-wider text-rpm-silver">{pkg.defaultDurationMinutes} min</span>
              {pkg.pricing.length > 0 && (
                <span className="text-[11px] text-rpm-silver/80">
                  {pkg.pricing.map((p) => `${p.sizeTier} $${p.price}`).join(' · ')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="text-xs text-rpm-silver flex flex-col gap-1">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
            <label className="text-xs text-rpm-silver flex flex-col gap-1">
              Base price ($)
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="px-2 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
            <label className="text-xs text-rpm-silver flex flex-col gap-1">
              Duration (min)
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="px-2 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {TIERS.map((tier) => (
              <label key={tier} className="text-xs text-rpm-silver flex flex-col gap-1 capitalize">
                {tier}
                <input
                  type="number"
                  value={pricing[tier]}
                  onChange={(e) => setPricing({ ...pricing, [tier]: e.target.value })}
                  placeholder={`$${pkg.basePrice}`}
                  className="px-2 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-rpm-silver flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Active (offered to customers)
            </label>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} disabled={busy} className="px-3 py-1.5 text-xs text-rpm-silver hover:text-rpm-white">Cancel</button>
              <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50">
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
