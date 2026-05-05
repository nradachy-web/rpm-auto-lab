'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { api } from '@/lib/api';

interface Settings {
  shopName: string;
  taxRateBps: number;
  depositRatioBps: number;
  timeZone: string;
  loyaltyPointsPerDollar: number;
  loyaltyDollarsPerHundredPoints: number;
  referralRewardCents: number;
  googleReviewUrl?: string | null;
  emailSignature?: string | null;
}

const TZ = ['America/Detroit', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'];

export default function ShopSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ settings: Settings }>('/api/admin/shop');
      if (res.ok) setS(res.data?.settings ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading || !s) return <div className="text-rpm-silver text-sm">Loading…</div>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });

  const save = async () => {
    setBusy(true);
    const res = await api.patch('/api/admin/shop', s);
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Save failed');
      return;
    }
    setSavedAt(new Date());
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <Store className="w-6 h-6 text-rpm-red" />
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Shop settings</h1>
          <p className="text-rpm-silver mt-1 text-sm">One place for tax rate, deposits, hours, loyalty rules, and shop branding.</p>
        </div>
      </header>

      <Section title="Brand">
        <Field label="Shop name">
          <input value={s.shopName} onChange={(e) => set('shopName', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </Field>
        <Field label="Time zone">
          <select value={s.timeZone} onChange={(e) => set('timeZone', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
            {TZ.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Money rules">
        <Field label="Sales tax rate (%)">
          <input
            type="number"
            step="0.01"
            value={(s.taxRateBps / 100).toFixed(2)}
            onChange={(e) => set('taxRateBps', Math.round((parseFloat(e.target.value) || 0) * 100))}
            className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <Hint>Applied to new invoices by default. Per-invoice override still works.</Hint>
        </Field>
        <Field label="Deposit ratio (%)">
          <input
            type="number"
            step="1"
            min={0}
            max={100}
            value={Math.round(s.depositRatioBps / 100)}
            onChange={(e) => set('depositRatioBps', Math.round((parseFloat(e.target.value) || 0) * 100))}
            className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <Hint>Default deposit on quote-accept. Customer can pay this to lock the slot.</Hint>
        </Field>
      </Section>

      <Section title="Loyalty">
        <Field label="Points earned per $1">
          <input type="number" step="1" value={s.loyaltyPointsPerDollar} onChange={(e) => set('loyaltyPointsPerDollar', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </Field>
        <Field label="Dollars credited per 100 points">
          <input type="number" step="1" value={s.loyaltyDollarsPerHundredPoints} onChange={(e) => set('loyaltyDollarsPerHundredPoints', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </Field>
        <Field label="Referral reward each side ($)">
          <input
            type="number"
            step="1"
            value={Math.round(s.referralRewardCents / 100)}
            onChange={(e) => set('referralRewardCents', Math.round((parseFloat(e.target.value) || 0) * 100))}
            className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <Hint>Both the referrer and the new customer get this credit on first completed job.</Hint>
        </Field>
      </Section>

      <Section title="Reviews + email">
        <Field label="Google review URL">
          <input value={s.googleReviewUrl ?? ''} onChange={(e) => set('googleReviewUrl', e.target.value)} placeholder="https://g.page/r/..." className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <Hint>Surfaced on review-request emails so happy customers can leave you a Google review.</Hint>
        </Field>
        <Field label="Email signature">
          <textarea rows={3} value={s.emailSignature ?? ''} onChange={(e) => set('emailSignature', e.target.value)} placeholder="Alex Mackris · RPM Auto Lab · (248) 555-0199" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none" />
        </Field>
      </Section>

      <footer className="flex items-center justify-between">
        <span className="text-xs text-rpm-silver">{savedAt && `Saved ${savedAt.toLocaleTimeString()}`}</span>
        <button onClick={save} disabled={busy} className="px-5 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-rpm-silver">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-rpm-silver/60 mt-1">{children}</div>;
}
