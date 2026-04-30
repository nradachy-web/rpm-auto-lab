'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, X, Download } from 'lucide-react';
import { api, API_BASE } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
}
export interface InvoicePayment {
  id: string;
  amountCents: number;
  method: string;
  reference?: string | null;
  receivedAt: string;
}
export interface InvoiceDetail {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'void' | 'refunded';
  notes?: string | null;
  taxRateBps: number;
  discountCents: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  stripeBalanceUrl?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string; phone?: string | null };
  job?: { id: string; vehicle?: { year: number; make: string; model: string; trim?: string | null } | null } | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function InvoiceDetail({
  id, onClose, allowEdit = true,
}: {
  id: string;
  onClose: () => void;
  allowEdit?: boolean;
}) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ invoice: InvoiceDetail }>(`/api/admin/invoices/${id}`);
    if (!res.ok) setErr(res.error || 'Failed');
    else setInvoice(res.data?.invoice ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-rpm-dark border border-rpm-gray/60 rounded-xl p-5 max-w-2xl w-full my-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between">
          <div>
            {loading && <div className="text-rpm-silver text-sm">Loading…</div>}
            {invoice && (
              <>
                <div className="text-2xl font-black text-rpm-white">{invoice.number}</div>
                <div className="text-xs text-rpm-silver">
                  {invoice.user.name} {invoice.user.email && `· ${invoice.user.email}`}
                  {invoice.job?.vehicle && ` · ${invoice.job.vehicle.year} ${invoice.job.vehicle.make} ${invoice.job.vehicle.model}`}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {invoice && (
              <a
                href={`${API_BASE}/api/portal/invoices/${invoice.id}/receipt`}
                target="_blank"
                rel="noopener"
                className="px-2 py-1.5 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white flex items-center gap-1"
                title="Open PDF in new tab"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </a>
            )}
            <button onClick={onClose} aria-label="Close" className="text-rpm-silver hover:text-rpm-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
        {err && <div className="text-rpm-red text-sm">{err}</div>}
        {invoice && (
          <>
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rpm-silver mb-2">Line items</h3>
              {allowEdit ? <LineEditor invoice={invoice} onChange={load} /> : <LineReadOnly items={invoice.lineItems} />}
              <Totals invoice={invoice} onChange={load} editable={allowEdit} />
            </section>
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rpm-silver mb-2">Payments</h3>
              <PaymentsList invoice={invoice} onChange={load} editable={allowEdit} />
            </section>
            {allowEdit && (
              <section className="flex flex-wrap gap-2 pt-3 border-t border-rpm-gray/30">
                {invoice.status === 'draft' && (
                  <button
                    onClick={async () => { await api.patch(`/api/admin/invoices/${invoice.id}`, { issued: true }); load(); }}
                    className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark"
                  >
                    Mark as issued
                  </button>
                )}
                {invoice.balanceCents > 0 && !invoice.stripeBalanceUrl && (
                  <button
                    onClick={async () => {
                      const res = await api.post(`/api/admin/invoices/${invoice.id}/balance-link`, {});
                      if (!res.ok) alert(res.error || 'Stripe not configured');
                      load();
                    }}
                    className="px-3 py-2 rounded-lg border border-emerald-500/40 text-sm text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Generate pay link
                  </button>
                )}
                {invoice.stripeBalanceUrl && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(invoice.stripeBalanceUrl!); alert('Link copied'); }}
                    className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white"
                  >
                    Copy pay link
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LineReadOnly({ items }: { items: InvoiceLineItem[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((li) => (
        <div key={li.id} className="flex items-center justify-between p-2 rounded-lg bg-rpm-charcoal/40 border border-rpm-gray/30 text-sm">
          <div>
            <div className="text-rpm-white">{li.description}</div>
            <div className="text-[11px] text-rpm-silver">{li.quantity} × {$(li.unitCents)}</div>
          </div>
          <div className="text-rpm-white tabular-nums">{$(li.totalCents)}</div>
        </div>
      ))}
    </div>
  );
}

function LineEditor({ invoice, onChange }: { invoice: InvoiceDetail; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');

  const addLine = async () => {
    const cents = Math.round(parseFloat(price) * 100);
    if (!desc.trim() || isNaN(cents) || cents < 0) return;
    setAdding(true);
    const res = await api.post(`/api/admin/invoices/${invoice.id}/line-items`, {
      description: desc.trim(),
      quantity: Math.max(1, parseInt(qty) || 1),
      unitCents: cents,
    });
    setAdding(false);
    if (!res.ok) { alert(res.error || 'Failed'); return; }
    setDesc(''); setQty('1'); setPrice('');
    onChange();
  };

  const removeLine = async (id: string) => {
    await api.delete(`/api/admin/invoices/${invoice.id}/line-items/${id}`);
    onChange();
  };

  return (
    <div className="space-y-2">
      {invoice.lineItems.map((li) => (
        <div key={li.id} className="flex items-center gap-2 p-2 rounded-lg bg-rpm-charcoal/40 border border-rpm-gray/30">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-rpm-white truncate">{li.description}</div>
            <div className="text-[11px] text-rpm-silver">{li.quantity} × {$(li.unitCents)}</div>
          </div>
          <div className="text-sm text-rpm-white tabular-nums">{$(li.totalCents)}</div>
          <button onClick={() => removeLine(li.id)} className="text-rpm-silver hover:text-rpm-red" aria-label="Delete line">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t border-rpm-gray/30">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Line description" className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input type="number" value={qty} min={1} onChange={(e) => setQty(e.target.value)} className="w-14 px-2 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white text-center" />
        <span className="text-rpm-silver">$</span>
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-20 px-2 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <button onClick={addLine} disabled={adding} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />Add
        </button>
      </div>
    </div>
  );
}

function Totals({ invoice, onChange, editable }: { invoice: InvoiceDetail; onChange: () => void; editable: boolean }) {
  const [taxBps, setTaxBps] = useState(String(invoice.taxRateBps));
  const [discount, setDiscount] = useState(String(invoice.discountCents / 100));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await api.patch(`/api/admin/invoices/${invoice.id}`, {
      taxRateBps: parseInt(taxBps) || 0,
      discountCents: Math.round(parseFloat(discount) * 100) || 0,
    });
    setBusy(false);
    onChange();
  };

  const dirty = parseInt(taxBps) !== invoice.taxRateBps || Math.round(parseFloat(discount) * 100) !== invoice.discountCents;

  return (
    <dl className="mt-4 pt-3 border-t border-rpm-gray/30 space-y-1.5 text-sm">
      <div className="flex justify-between"><dt className="text-rpm-silver">Subtotal</dt><dd className="text-rpm-white tabular-nums">{$(invoice.subtotalCents)}</dd></div>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-rpm-silver flex items-center gap-2">
          Discount
          {editable ? (
            <>
              <span>$</span>
              <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-20 px-2 py-1 rounded-md bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white" />
            </>
          ) : null}
        </dt>
        <dd className="text-rpm-white tabular-nums">−{$(invoice.discountCents)}</dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-rpm-silver flex items-center gap-2">
          Tax
          {editable ? (
            <>
              <input type="number" value={taxBps} onChange={(e) => setTaxBps(e.target.value)} className="w-16 px-2 py-1 rounded-md bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white" />
              <span className="text-xs text-rpm-silver/70">bps ({(invoice.taxRateBps / 100).toFixed(2)}%)</span>
            </>
          ) : <span className="text-xs text-rpm-silver/70">({(invoice.taxRateBps / 100).toFixed(2)}%)</span>}
        </dt>
        <dd className="text-rpm-white tabular-nums">{$(invoice.taxCents)}</dd>
      </div>
      <div className="flex justify-between text-base font-bold pt-2 border-t border-rpm-gray/30">
        <dt className="text-rpm-white">Total</dt>
        <dd className="text-rpm-white tabular-nums">{$(invoice.totalCents)}</dd>
      </div>
      <div className="flex justify-between text-sm">
        <dt className="text-rpm-silver">Paid</dt>
        <dd className="text-emerald-400 tabular-nums">{$(invoice.paidCents)}</dd>
      </div>
      <div className={cn('flex justify-between text-base font-bold')}>
        <dt className="text-rpm-silver">Balance</dt>
        <dd className={cn('tabular-nums', invoice.balanceCents > 0 ? 'text-amber-400' : 'text-emerald-400')}>{$(invoice.balanceCents)}</dd>
      </div>
      {editable && dirty && (
        <div className="flex justify-end pt-2">
          <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-xs font-bold disabled:opacity-50">{busy ? 'Saving…' : 'Save totals'}</button>
        </div>
      )}
    </dl>
  );
}

function PaymentsList({ invoice, onChange, editable }: { invoice: InvoiceDetail; onChange: () => void; editable: boolean }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card_in_person' | 'check' | 'ach' | 'other'>('cash');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) return;
    setBusy(true);
    await api.post(`/api/admin/invoices/${invoice.id}/payments`, { amountCents: cents, method });
    setBusy(false);
    setAmount('');
    onChange();
  };

  return (
    <div className="space-y-2">
      {invoice.payments.length === 0 && <div className="text-sm text-rpm-silver/70 italic">No payments recorded yet.</div>}
      {invoice.payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-rpm-charcoal/40 border border-rpm-gray/30 text-sm">
          <div>
            <div className="text-rpm-white capitalize">{p.method.replace(/_/g, ' ')}</div>
            <div className="text-[11px] text-rpm-silver">{new Date(p.receivedAt).toLocaleString()}{p.reference && ` · ${p.reference}`}</div>
          </div>
          <div className="text-emerald-400 tabular-nums font-bold">{$(p.amountCents)}</div>
        </div>
      ))}
      {editable && invoice.balanceCents > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-rpm-gray/30">
          <select value={method} onChange={(e) => setMethod(e.target.value as never)} className="px-2 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
            <option value="cash">Cash</option>
            <option value="card_in_person">Card in person</option>
            <option value="check">Check</option>
            <option value="ach">ACH</option>
            <option value="other">Other</option>
          </select>
          <span className="text-rpm-silver">$</span>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${(invoice.balanceCents / 100).toFixed(2)}`} className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <button onClick={add} disabled={busy || !amount} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">Record</button>
        </div>
      )}
    </div>
  );
}
