'use client';

import { useEffect, useState } from 'react';
import { Gift, Copy } from 'lucide-react';
import { api } from '@/lib/api';

interface LedgerRow { id: string; delta: number; reason: string; createdAt: string }
interface Rewards {
  points: number;
  referralCode: string;
  ledger: LedgerRow[];
  referralCount: number;
}

export default function RewardsPage() {
  const [data, setData] = useState<Rewards | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<Rewards>('/api/portal/rewards');
      if (res.ok) setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading || !data) return <div className="text-rpm-silver text-sm">Loading…</div>;

  const referralUrl = `https://nradachy-web.github.io/rpm-auto-lab/?ref=${data.referralCode}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Rewards</h1>
        <p className="text-rpm-silver mt-1">Earn 1 point per dollar spent. Refer friends, both get $25 off.</p>
      </header>

      <section className="rounded-2xl border border-rpm-red/40 bg-gradient-to-br from-rpm-red/10 to-rpm-charcoal p-6">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-rpm-red" />
          <div>
            <div className="text-xs uppercase tracking-wider text-rpm-silver">Loyalty balance</div>
            <div className="text-4xl font-black text-rpm-white tabular-nums">{data.points}</div>
            <div className="text-xs text-rpm-silver">≈ ${(data.points * 0.05).toFixed(2)} value · 100 pts = $5</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-6 space-y-3">
        <div>
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Your referral code</h2>
          <div className="text-3xl font-black text-rpm-red tracking-wider tabular-nums mt-1">{data.referralCode}</div>
          <div className="text-xs text-rpm-silver mt-1">
            Share your code or link with friends. When they get their first service, you both get $25 off.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralUrl}
            className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(referralUrl); }}
            className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <div className="text-xs text-rpm-silver">{data.referralCount} successful referrals so far.</div>
      </section>

      <section className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-6">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-3">Recent activity</h2>
        {data.ledger.length === 0 ? (
          <div className="text-sm text-rpm-silver/70 italic">No activity yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.ledger.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <div>
                  <div className="text-rpm-white">{row.reason}</div>
                  <div className="text-[11px] text-rpm-silver">{new Date(row.createdAt).toLocaleString()}</div>
                </div>
                <div className={row.delta > 0 ? 'text-emerald-400 tabular-nums font-bold' : 'text-rpm-red tabular-nums font-bold'}>
                  {row.delta > 0 ? '+' : ''}{row.delta}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
