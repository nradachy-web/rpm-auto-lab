'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Percent } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Kind = 'percent_bps' | 'flat_cents';
interface Promo {
  id: string;
  code?: string | null;
  headline: string;
  description?: string | null;
  discountKind: Kind;
  discountValue: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  showOnAccept: boolean;
  showOnSite: boolean;
}

const fmt = (p: Promo) => p.discountKind === 'percent_bps'
  ? `${(p.discountValue / 100).toFixed(p.discountValue % 100 === 0 ? 0 : 1)}% off`
  : `$${(p.discountValue / 100).toFixed(2)} off`;

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await api.get<{ promotions: Promo[] }>('/api/admin/promotions');
    if (res.ok) setPromos(res.data?.promotions ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-6 h-6 text-rpm-red" />
            <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Promotions</h1>
          </div>
          <p className="text-rpm-silver mt-1 text-sm">Limited-time offers shown on the marketing site or the customer quote-accept page.</p>
        </div>
        <button onClick={() => setCreating(true)} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> New promotion
        </button>
      </header>

      {creating && <Composer onCancel={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}

      <div className="space-y-2">
        {promos.length === 0 && !creating && (
          <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
            No promotions yet. Create one to drive seasonal bookings.
          </div>
        )}
        {promos.map((p) => (
          <PromoRow key={p.id} promo={p} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function Composer({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<Kind>('percent_bps');
  const [value, setValue] = useState('10');
  const [endsAt, setEndsAt] = useState('');
  const [showOnAccept, setShowOnAccept] = useState(true);
  const [showOnSite, setShowOnSite] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!headline.trim()) return;
    setBusy(true);
    const discountValue = kind === 'percent_bps'
      ? Math.round((parseFloat(value) || 0) * 100)
      : Math.round((parseFloat(value) || 0) * 100);
    const res = await api.post('/api/admin/promotions', {
      headline: headline.trim(),
      description: description || undefined,
      discountKind: kind,
      discountValue,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      showOnAccept,
      showOnSite,
    });
    setBusy(false);
    if (!res.ok) { alert(res.error || 'Failed'); return; }
    onSaved();
  };

  return (
    <div className="rounded-xl border border-rpm-red/40 bg-rpm-dark p-4 space-y-3">
      <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g. May PPF Special)" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
          <option value="percent_bps">% off</option>
          <option value="flat_cents">$ off</option>
        </select>
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Discount" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      </div>
      <div className="flex items-center gap-3 text-sm text-rpm-silver">
        <label className="flex items-center gap-1"><input type="checkbox" checked={showOnAccept} onChange={(e) => setShowOnAccept(e.target.checked)} /> Show on quote-accept</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={showOnSite} onChange={(e) => setShowOnSite(e.target.checked)} /> Show on marketing site</label>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
        <button onClick={create} disabled={busy || !headline.trim()} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">
          {busy ? 'Saving…' : 'Save promotion'}
        </button>
      </div>
    </div>
  );
}

function PromoRow({ promo, onChange }: { promo: Promo; onChange: () => void }) {
  const toggleActive = async () => {
    await api.patch(`/api/admin/promotions/${promo.id}`, { active: !promo.active });
    onChange();
  };
  const remove = async () => {
    if (!window.confirm('Delete this promotion?')) return;
    await api.delete(`/api/admin/promotions/${promo.id}`);
    onChange();
  };
  const expired = promo.endsAt && new Date(promo.endsAt) < new Date();

  return (
    <div className={cn('rounded-xl border p-4 flex items-center justify-between gap-3', expired ? 'border-rpm-gray/30 bg-rpm-dark/50 opacity-60' : 'border-rpm-gray/40 bg-rpm-dark')}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-base font-bold text-rpm-white">{promo.headline}</div>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rpm-red/15 text-rpm-red border border-rpm-red/40">{fmt(promo)}</span>
          {expired && <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rpm-gray/30 text-rpm-silver">Expired</span>}
          {!promo.active && !expired && <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rpm-gray/30 text-rpm-silver">Paused</span>}
        </div>
        {promo.description && <div className="text-xs text-rpm-silver mt-1">{promo.description}</div>}
        <div className="text-[11px] text-rpm-silver/70 mt-1">
          {promo.endsAt ? `Ends ${new Date(promo.endsAt).toLocaleDateString()}` : 'No end date'}
          {' · '}
          {[promo.showOnAccept && 'Accept page', promo.showOnSite && 'Marketing site'].filter(Boolean).join(' · ') || 'Not surfaced'}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={toggleActive} className="px-2 py-1 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white">
          {promo.active ? 'Pause' : 'Activate'}
        </button>
        <button onClick={remove} className="p-1.5 rounded-md text-rpm-silver hover:text-rpm-red">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
