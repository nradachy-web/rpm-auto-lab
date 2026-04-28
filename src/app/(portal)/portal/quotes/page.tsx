'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }
interface Quote {
  id: string;
  services: string[];
  estimatedTotal: number;
  quotedAmount?: number | null;
  status: 'submitted' | 'quoted' | 'approved' | 'converted' | 'declined';
  submittedAt: string;
  respondedAt?: string | null;
  vehicle: Vehicle;
  notes?: string | null;
  depositAmount?: number | null;
  stripePaymentLinkUrl?: string | null;
  depositPaidAt?: string | null;
}

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const badge = (s: Quote['status']) => ({
  submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  quoted: 'bg-m-blue/10 text-m-blue border-m-blue/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  declined: 'bg-rpm-red/10 text-rpm-red border-rpm-red/30',
}[s]);

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ quotes: Quote[] }>('/api/portal/quotes');
      if (cancelled) return;
      if (!res.ok) setErr(res.error || 'Failed to load');
      else setQuotes(res.data?.quotes ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Quotes</h1>
          <p className="text-rpm-silver mt-1">Every quote you&apos;ve requested — past and present.</p>
        </div>
        <Link
          href="/contact"
          className="px-4 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark transition-colors"
        >
          New Quote
        </Link>
      </header>

      {quotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No quotes yet. <Link href="/contact" className="text-rpm-red hover:text-rpm-red-glow">Request one</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="text-lg font-black text-rpm-white">
                    {q.vehicle.year} {q.vehicle.make} {q.vehicle.model}
                  </div>
                  <div className="text-sm text-rpm-silver mt-0.5">{q.services.join(' + ')}</div>
                  <div className="text-[11px] text-rpm-silver/60 mt-1">
                    Submitted {new Date(q.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-rpm-silver uppercase tracking-wider">
                      {q.quotedAmount != null ? 'Quoted' : 'Estimated'}
                    </div>
                    <div className="text-xl font-black text-rpm-white tabular-nums">
                      ${(q.quotedAmount ?? q.estimatedTotal).toLocaleString()}
                    </div>
                  </div>
                  <span className={cn('text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border', badge(q.status))}>
                    {label(q.status)}
                  </span>
                </div>
              </div>
              {q.notes && (
                <p className="mt-3 text-sm text-rpm-silver italic">{q.notes}</p>
              )}
              {q.stripePaymentLinkUrl && !q.depositPaidAt && (
                <a
                  href={q.stripePaymentLinkUrl}
                  target="_blank"
                  rel="noopener"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark"
                >
                  Pay deposit{q.depositAmount ? ` — $${(q.depositAmount / 100).toFixed(2)}` : ''}
                </a>
              )}
              {q.depositPaidAt && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  Deposit paid · {new Date(q.depositPaidAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
