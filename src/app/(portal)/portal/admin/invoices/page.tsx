'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import InvoiceDetail from '@/components/portal/InvoiceDetail';

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'void' | 'refunded';
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  createdAt: string;
  dueAt?: string | null;
  user: { id: string; email: string; name: string };
  job?: { id: string; vehicle?: { year: number; make: string; model: string } | null } | null;
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const badge = (s: Invoice['status']) =>
  s === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : s === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : s === 'sent' ? 'bg-m-blue/10 text-m-blue border-m-blue/30'
    : s === 'void' || s === 'refunded' ? 'bg-rpm-red/10 text-rpm-red border-rpm-red/30'
    : 'bg-rpm-gray/15 text-rpm-silver border-rpm-gray/40';

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <AdminInvoicesInner />
    </Suspense>
  );
}

function AdminInvoicesInner() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Invoice['status']>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ invoices: Invoice[] }>('/api/admin/invoices');
    if (res.ok) setInvoices(res.data?.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const open = searchParams?.get('open');
    if (open) setOpenId(open);
  }, [searchParams]);

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Invoices</h1>
        <p className="text-rpm-silver mt-1">Track invoices, payments, and outstanding balances.</p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'sent', 'partial', 'paid', 'void'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize',
              filter === f ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white hover:bg-rpm-charcoal'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No invoices yet. Generate one from a job&apos;s &quot;Create invoice&quot; button (Admin tab).
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rpm-gray/40 bg-rpm-dark">
          <table className="w-full text-sm">
            <thead className="bg-rpm-charcoal/60 text-xs uppercase tracking-wider text-rpm-silver">
              <tr>
                <th className="text-left p-3">Invoice</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Vehicle</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-rpm-gray/30 hover:bg-rpm-charcoal/30 cursor-pointer" onClick={() => setOpenId(inv.id)}>
                  <td className="p-3 text-rpm-white font-bold">{inv.number}</td>
                  <td className="p-3 text-rpm-silver">{inv.user.name}</td>
                  <td className="p-3 text-rpm-silver">
                    {inv.job?.vehicle ? `${inv.job.vehicle.year} ${inv.job.vehicle.make} ${inv.job.vehicle.model}` : '—'}
                  </td>
                  <td className="p-3 text-right text-rpm-white tabular-nums">{$(inv.totalCents)}</td>
                  <td className="p-3 text-right tabular-nums">
                    <span className={inv.balanceCents > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      {$(inv.balanceCents)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn('text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border', badge(inv.status))}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-rpm-silver/80 text-xs">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && <InvoiceDetail id={openId} onClose={() => { setOpenId(null); load(); }} />}
    </div>
  );
}
