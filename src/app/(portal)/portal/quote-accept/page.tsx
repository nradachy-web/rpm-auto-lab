'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import PartsDiagram, { type DiagramValue } from '@/components/portal/PartsDiagram';

interface Vehicle { year: number; make: string; model: string; trim?: string | null; color?: string | null }
interface Option {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  durationMinutes?: number | null;
  recommended: boolean;
}
interface QuoteData {
  quote: {
    id: string;
    services: string[];
    estimatedTotal: number;
    quotedAmount?: number | null;
    notes?: string | null;
    status: string;
    acceptedAt?: string | null;
    selectedOptionId?: string | null;
    partsDiagram?: Record<string, string> | null;
    stripePaymentLinkUrl?: string | null;
    depositAmount?: number | null;
  };
  vehicle: Vehicle;
  customerName: string;
  options: Option[];
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function QuoteAcceptPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm p-6">Loading…</div>}>
      <QuoteAcceptInner />
    </Suspense>
  );
}

function QuoteAcceptInner() {
  const params = useSearchParams();
  const token = params?.get('token') ?? '';
  const [data, setData] = useState<QuoteData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [promotions, setPromotions] = useState<Array<{ id: string; headline: string; description?: string | null; discountKind: 'percent_bps' | 'flat_cents'; discountValue: number; endsAt?: string | null }>>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await api.get<QuoteData>(`/api/portal/quotes/accept/${token}`);
      if (!res.ok) setErr(res.error || 'Invalid link');
      else {
        setData(res.data);
        const recommended = res.data?.options.find((o) => o.recommended);
        if (recommended) setChosen(recommended.id);
        else if (res.data?.options[0]) setChosen(res.data.options[0].id);
      }
      const promoRes = await api.get<{ promotions: typeof promotions }>('/api/promotions/active?surface=accept');
      if (promoRes.ok) setPromotions(promoRes.data?.promotions ?? []);
    })();
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    const body = data?.options.length ? { optionId: chosen } : {};
    const res = await api.post(`/api/portal/quotes/accept/${token}`, body);
    setAccepting(false);
    if (!res.ok) {
      alert(res.error || 'Could not accept');
      return;
    }
    setDone(true);
  };

  if (!token) return <div className="max-w-md mx-auto py-12 text-rpm-red">Missing ?token=</div>;
  if (err) return <div className="max-w-md mx-auto py-12 text-rpm-red">{err}</div>;
  if (!data) return <div className="max-w-md mx-auto py-12 text-rpm-silver">Loading your quote…</div>;

  if (done || data.quote.acceptedAt) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-black text-rpm-white">Quote accepted!</h1>
        <p className="text-rpm-silver">
          Thanks {data.customerName.split(' ')[0]}. We&apos;ll reach out shortly to schedule your {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}.
        </p>
        {data.quote.stripePaymentLinkUrl && (
          <a href={data.quote.stripePaymentLinkUrl} className="inline-block px-5 py-3 rounded-lg bg-rpm-red text-white font-bold">
            Pay deposit{data.quote.depositAmount ? ` — $${(data.quote.depositAmount / 100).toFixed(2)}` : ''}
          </a>
        )}
      </div>
    );
  }

  const hasOptions = data.options.length > 0;
  const baseTotal = data.quote.quotedAmount ?? data.quote.estimatedTotal;
  const partsDiagram = (data.quote.partsDiagram || {}) as DiagramValue;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 px-4">
      <header>
        <div className="text-xs uppercase tracking-[0.25em] text-rpm-red font-bold">Your quote</div>
        <h1 className="text-3xl font-black text-rpm-white mt-1">
          Hi {data.customerName.split(' ')[0]} —
        </h1>
        <p className="text-rpm-silver mt-1">
          Quote for your <strong className="text-rpm-white">{data.vehicle.year} {data.vehicle.make} {data.vehicle.model}</strong>
          {data.vehicle.color && ` (${data.vehicle.color})`}.
        </p>
      </header>

      {hasOptions ? (
        <section>
          <h2 className="text-sm font-bold text-rpm-white mb-3">Pick a package</h2>
          <div className="space-y-3">
            {data.options.map((o) => {
              const sel = chosen === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setChosen(o.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition',
                    sel ? 'bg-rpm-red/10 border-rpm-red' : 'bg-rpm-dark border-rpm-gray/50 hover:border-rpm-silver/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-rpm-white flex items-center gap-2">
                        {o.name}
                        {o.recommended && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1"><Star className="w-3 h-3" /> Recommended</span>}
                      </div>
                      {o.description && <div className="text-sm text-rpm-silver mt-1">{o.description}</div>}
                      {o.durationMinutes && (
                        <div className="text-[11px] text-rpm-silver/70 mt-1">{Math.round(o.durationMinutes / 60 * 10) / 10}h estimated</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-rpm-white tabular-nums">{$(o.priceCents)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-rpm-silver">Quote total</div>
              <div className="text-3xl font-black text-rpm-white tabular-nums mt-0.5">${baseTotal.toLocaleString()}</div>
            </div>
            <div className="text-right text-sm text-rpm-silver">
              {data.quote.services.join(' + ')}
            </div>
          </div>
        </section>
      )}

      {promotions.length > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wider font-bold text-amber-400">Limited-time</div>
          {promotions.map((p) => {
            const fmt = p.discountKind === 'percent_bps'
              ? `${(p.discountValue / 100).toFixed(p.discountValue % 100 === 0 ? 0 : 1)}% off`
              : `$${(p.discountValue / 100).toFixed(2)} off`;
            return (
              <div key={p.id} className="text-sm">
                <span className="text-rpm-white font-bold">{p.headline}</span>
                <span className="text-amber-300 font-bold ml-2">{fmt}</span>
                {p.description && <div className="text-xs text-rpm-silver mt-0.5">{p.description}</div>}
                {p.endsAt && <div className="text-[10px] text-rpm-silver/70 mt-0.5">Ends {new Date(p.endsAt).toLocaleDateString()}</div>}
              </div>
            );
          })}
        </section>
      )}

      {Object.keys(partsDiagram).length > 0 && (
        <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5">
          <h2 className="text-sm font-bold text-rpm-white mb-2">Coverage included</h2>
          <PartsDiagram value={partsDiagram} readOnly />
        </section>
      )}

      {data.quote.notes && (
        <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5">
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver mb-2">Notes from us</h2>
          <p className="text-sm text-rpm-silver whitespace-pre-wrap">{data.quote.notes}</p>
        </section>
      )}

      <button
        onClick={accept}
        disabled={accepting || (hasOptions && !chosen)}
        className="w-full px-5 py-4 rounded-xl bg-rpm-red text-white font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" />
        {accepting ? 'Submitting…' : `Accept${hasOptions && chosen ? ` ${data.options.find((o) => o.id === chosen)?.name}` : ' quote'}`}
      </button>
      <p className="text-[11px] text-rpm-silver/70 text-center">
        Questions? Reply to your quote email or text the shop. RPM Auto Lab · Orion Township, MI
      </p>
    </div>
  );
}
