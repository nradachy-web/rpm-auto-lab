'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Repeat } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Plan {
  slug: string;
  name: string;
  description: string;
  intervalDays: number;
  priceCents: number;
}
interface Subscription {
  id: string;
  packageSlug: string;
  intervalDays: number;
  priceCents: number;
  status: 'active' | 'paused' | 'cancelled' | 'past_due';
  nextChargeAt?: string | null;
  startedAt: string;
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <SubsInner />
    </Suspense>
  );
}

function SubsInner() {
  const params = useSearchParams();
  const success = params?.get('success');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await api.get<{ plans: Plan[]; subscriptions: Subscription[] }>('/api/portal/subscriptions');
    if (res.ok && res.data) {
      setPlans(res.data.plans);
      setSubs(res.data.subscriptions);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const subscribe = async (slug: string) => {
    setBusy(slug);
    const res = await api.post<{ url: string }>('/api/portal/subscriptions/checkout', { planSlug: slug });
    setBusy(null);
    if (!res.ok || !res.data?.url) {
      alert(res.error || 'Could not start checkout');
      return;
    }
    window.location.href = res.data.url;
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <Repeat className="w-6 h-6 text-rpm-red" />
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Subscription plans</h1>
          <p className="text-rpm-silver mt-1">Set-and-forget care on a regular cadence.</p>
        </div>
      </header>

      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          Subscription started! Your first appointment will be scheduled within 24 hours.
        </div>
      )}

      {subs.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">Your subscriptions</h2>
          <div className="space-y-2">
            {subs.map((s) => {
              const plan = plans.find((p) => p.slug === s.packageSlug);
              return (
                <div key={s.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-rpm-white">{plan?.name ?? s.packageSlug}</div>
                    <div className="text-xs text-rpm-silver">
                      Every {s.intervalDays} days · {$(s.priceCents)}/charge · started {new Date(s.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border',
                    s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : s.status === 'cancelled' ? 'bg-rpm-red/10 text-rpm-red border-rpm-red/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  )}>
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">Available plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plans.map((p) => (
            <article key={p.slug} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 flex flex-col">
              <h3 className="text-lg font-bold text-rpm-white">{p.name}</h3>
              <p className="text-sm text-rpm-silver mt-1 flex-1">{p.description}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-black text-rpm-white tabular-nums">{$(p.priceCents)}</div>
                  <div className="text-xs text-rpm-silver">every {p.intervalDays} days</div>
                </div>
                <button
                  onClick={() => subscribe(p.slug)}
                  disabled={busy === p.slug}
                  className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold hover:bg-rpm-red-dark disabled:opacity-50"
                >
                  {busy === p.slug ? '…' : 'Subscribe'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
