'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import InvoiceDetail, { type InvoiceDetail as InvoiceDetailT } from '@/components/portal/InvoiceDetail';

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const badge = (s: string) =>
  s === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : s === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : s === 'sent' ? 'bg-m-blue/10 text-m-blue border-m-blue/30'
    : 'bg-rpm-gray/15 text-rpm-silver border-rpm-gray/40';

export default function PortalInvoicesPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <PortalInvoicesInner />
    </Suspense>
  );
}

function PortalInvoicesInner() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceDetailT[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ invoices: InvoiceDetailT[] }>('/api/portal/invoices');
    if (res.ok) setInvoices(res.data?.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const paid = searchParams?.get('paid');
    if (paid) {
      // Soft refresh after Stripe redirect to pick up the new payment.
      const t = setTimeout(load, 800);
      return () => clearTimeout(t);
    }
  }, [searchParams, load]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Invoices</h1>
        <p className="text-rpm-silver mt-1">Pay outstanding balances or download a receipt.</p>
      </header>

      {searchParams?.get('paid') && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          Payment received — thank you! Your balance will update shortly.
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No invoices yet.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setOpenId(inv.id)}
              className="w-full text-left rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 hover:border-rpm-red/50 transition"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-base font-bold text-rpm-white">{inv.number}</div>
                  <div className="text-xs text-rpm-silver mt-0.5">
                    {inv.job?.vehicle && `${inv.job.vehicle.year} ${inv.job.vehicle.make} ${inv.job.vehicle.model}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={cn('text-lg font-black tabular-nums', inv.balanceCents > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                      {$(inv.balanceCents)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-rpm-silver">{inv.balanceCents > 0 ? 'Balance' : 'Paid in full'}</div>
                  </div>
                  <span className={cn('text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border', badge(inv.status))}>
                    {inv.status}
                  </span>
                </div>
              </div>
              {inv.balanceCents > 0 && inv.stripeBalanceUrl && (
                <a
                  href={inv.stripeBalanceUrl}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark"
                >
                  Pay {$(inv.balanceCents)} now
                </a>
              )}
            </button>
          ))}
        </div>
      )}

      {openId && <InvoiceDetail id={openId} onClose={() => { setOpenId(null); load(); }} allowEdit={false} />}
    </div>
  );
}
