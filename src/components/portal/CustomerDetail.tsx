'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, MessageSquare, Receipt, Wrench, Car, Plus, StickyNote, Trash2, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string; year: number; make: string; model: string; trim?: string | null;
  color?: string | null; licensePlate?: string | null; vin?: string | null; sizeTier?: string | null;
}
interface Quote {
  id: string; services: string[]; status: string; estimatedTotal: number; quotedAmount?: number | null;
  submittedAt: string; vehicle?: Vehicle | null; source?: string | null;
}
interface Job {
  id: string; services: string[]; status: string; scheduledAt?: string | null; updatedAt: string;
  vehicle?: Vehicle | null; invoice?: { id: string; number: string; status: string; totalCents: number; balanceCents: number } | null;
}
interface Invoice {
  id: string; number: string; status: string; totalCents: number; paidCents: number; balanceCents: number; createdAt: string;
  lineItems: { id: string; description: string; totalCents: number }[];
  payments: { id: string; amountCents: number; method: string; receivedAt: string }[];
}
interface Subscription {
  id: string; packageSlug: string; status: string; intervalDays: number; priceCents: number;
}
interface CustomerFull {
  id: string; name: string; email: string; phone?: string | null; notes?: string | null;
  smsConsent: boolean; pushConsent: boolean;
  loyaltyPoints: number; referralCode?: string | null; createdAt: string;
  vehicles: Vehicle[]; quotes: Quote[]; jobs: Job[]; invoices: Invoice[];
  subscriptions: Subscription[];
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

const statusPill = (status: string) =>
  status === 'completed' || status === 'picked_up' || status === 'paid'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : status === 'in_progress' || status === 'partial'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : status === 'cancelled' || status === 'declined' || status === 'void'
    ? 'bg-rpm-red/10 text-rpm-red border-rpm-red/30'
    : 'bg-rpm-gray/15 text-rpm-silver border-rpm-gray/40';

const labelStatus = (s: string) =>
  s === 'in_progress' ? 'In Progress' : s === 'picked_up' ? 'Picked Up' : s.charAt(0).toUpperCase() + s.slice(1);

export default function CustomerDetail({ id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted?: () => void }) {
  const [c, setC] = useState<CustomerFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<{ customer: CustomerFull }>(`/api/admin/customers/${id}`);
    if (!res.ok) setErr(res.error || 'Failed');
    else {
      setC(res.data?.customer ?? null);
      setNoteDraft(res.data?.customer?.notes ?? '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveNotes = async () => {
    await api.patch(`/api/admin/customers/${id}`, { notes: noteDraft || null });
    setEditingNotes(false);
    load();
  };

  const doDelete = async () => {
    if (!c) return;
    setDeleting(true);
    const res = await api.delete(`/api/admin/customers/${c.id}`);
    setDeleting(false);
    if (!res.ok) {
      alert(res.error || 'Could not delete this customer');
      return;
    }
    setConfirmDelete(false);
    onDeleted?.();
    onClose();
  };

  const ltv = c ? c.invoices.reduce((s, i) => s + i.paidCents, 0) : 0;
  const balance = c ? c.invoices.reduce((s, i) => s + i.balanceCents, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/70" />
      <aside
        className="w-full max-w-3xl bg-rpm-dark border-l border-rpm-gray/60 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-6 text-rpm-silver text-sm">Loading…</div>
        ) : err || !c ? (
          <div className="p-6 text-rpm-red text-sm">{err || 'Not found'}</div>
        ) : (
          <div className="p-6 space-y-6">
            <header className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-rpm-red font-bold">Customer</div>
                <h2 className="text-2xl md:text-3xl font-black text-rpm-white mt-1">{c.name}</h2>
                <div className="text-sm text-rpm-silver mt-1">
                  <a href={`mailto:${c.email}`} className="hover:text-rpm-white">{c.email}</a>
                  {c.phone && <> · <a href={`tel:${c.phone}`} className="hover:text-rpm-white">{c.phone}</a></>}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-rpm-silver/70 mt-1">
                  Joined {fmtDate(c.createdAt)} · {c.smsConsent ? 'SMS opted-in' : 'SMS off'} · {c.referralCode || '— no code'}
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="text-rpm-silver hover:text-rpm-white p-1">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Stat label="Lifetime" value={$(ltv)} />
              <Stat label="Open balance" value={$(balance)} accent={balance > 0 ? 'amber' : undefined} />
              <Stat label="Loyalty" value={`${c.loyaltyPoints} pts`} />
              <Stat label="Vehicles" value={String(c.vehicles.length)} />
            </div>

            <section className="rounded-xl border border-rpm-gray/40 bg-rpm-charcoal/30 p-4">
              <header className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wider text-rpm-silver font-bold flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Notes</h3>
                {!editingNotes && (
                  <button onClick={() => setEditingNotes(true)} className="text-xs text-rpm-silver hover:text-rpm-white">{c.notes ? 'Edit' : 'Add'}</button>
                )}
              </header>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-rpm-dark border border-rpm-gray text-sm text-rpm-white resize-none" placeholder="Private — admin only" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNotes(false)} className="text-xs text-rpm-silver">Cancel</button>
                    <button onClick={saveNotes} className="px-3 py-1 rounded-md bg-rpm-red text-white text-xs font-bold">Save</button>
                  </div>
                </div>
              ) : c.notes ? (
                <p className="text-sm text-amber-200/90 italic">{c.notes}</p>
              ) : (
                <p className="text-xs text-rpm-silver/60 italic">No notes yet.</p>
              )}
            </section>

            <section>
              <header className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-rpm-white flex items-center gap-2"><Car className="w-4 h-4 text-rpm-red" /> Vehicles ({c.vehicles.length})</h3>
              </header>
              {c.vehicles.length === 0 ? (
                <Empty msg="No vehicles." />
              ) : (
                <div className="space-y-1.5">
                  {c.vehicles.map((v) => (
                    <div key={v.id} className="rounded-lg border border-rpm-gray/30 bg-rpm-charcoal/30 p-3 text-sm">
                      <div className="text-rpm-white font-semibold">{v.year} {v.make} {v.model}{v.trim ? ` ${v.trim}` : ''}</div>
                      <div className="text-xs text-rpm-silver">
                        {[v.color, v.licensePlate, v.sizeTier].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <header className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-rpm-white flex items-center gap-2"><Wrench className="w-4 h-4 text-rpm-red" /> Jobs ({c.jobs.length})</h3>
              </header>
              {c.jobs.length === 0 ? (
                <Empty msg="No jobs yet." />
              ) : (
                <div className="space-y-1.5">
                  {c.jobs.map((j) => (
                    <div key={j.id} className="rounded-lg border border-rpm-gray/30 bg-rpm-charcoal/30 p-3 text-sm flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-rpm-white font-semibold truncate">{j.vehicle?.year} {j.vehicle?.make} {j.vehicle?.model}</div>
                        <div className="text-xs text-rpm-silver truncate">{j.services.join(', ')} · {fmtDate(j.scheduledAt || j.updatedAt)}</div>
                      </div>
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', statusPill(j.status))}>
                        {labelStatus(j.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <header className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-rpm-white flex items-center gap-2"><Receipt className="w-4 h-4 text-rpm-red" /> Quotes ({c.quotes.length})</h3>
              </header>
              {c.quotes.length === 0 ? (
                <Empty msg="No quotes." />
              ) : (
                <div className="space-y-1.5">
                  {c.quotes.map((q) => (
                    <div key={q.id} className="rounded-lg border border-rpm-gray/30 bg-rpm-charcoal/30 p-3 text-sm flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-rpm-white font-semibold truncate">{q.vehicle?.year} {q.vehicle?.make} {q.vehicle?.model}</div>
                        <div className="text-xs text-rpm-silver truncate">{q.services.join(', ')}{q.source ? ` · via ${q.source}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rpm-white tabular-nums">${(q.quotedAmount ?? q.estimatedTotal).toLocaleString()}</span>
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', statusPill(q.status))}>
                          {labelStatus(q.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <header className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-rpm-white flex items-center gap-2"><Receipt className="w-4 h-4 text-rpm-red" /> Invoices ({c.invoices.length})</h3>
              </header>
              {c.invoices.length === 0 ? (
                <Empty msg="No invoices." />
              ) : (
                <div className="space-y-1.5">
                  {c.invoices.map((inv) => (
                    <Link key={inv.id} href={`/portal/admin/invoices?open=${inv.id}`} className="block rounded-lg border border-rpm-gray/30 bg-rpm-charcoal/30 p-3 text-sm hover:border-rpm-red/40">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-rpm-white font-semibold">{inv.number}</div>
                          <div className="text-xs text-rpm-silver">{fmtDate(inv.createdAt)} · {inv.lineItems.length} item{inv.lineItems.length === 1 ? '' : 's'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-rpm-white tabular-nums">{$(inv.totalCents)}</div>
                          <div className={cn('text-[10px] font-bold uppercase tracking-wider', inv.balanceCents > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                            {inv.balanceCents > 0 ? `${$(inv.balanceCents)} due` : 'Paid'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="pt-3 border-t border-rpm-gray/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Link href={`/portal/admin/messages?customer=${c.id}`} className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Message
                </Link>
                <a href={`mailto:${c.email}`} className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </a>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}
                <Link href={`/portal/admin/new-quote?customer=${c.id}`} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark flex items-center gap-1">
                  <Plus className="w-4 h-4" /> New quote / job
                </Link>
              </div>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-lg border border-rpm-red/40 text-sm text-rpm-red hover:bg-rpm-red/10 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </section>
          </div>
        )}
      </aside>

      {confirmDelete && c && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-rpm-dark border border-rpm-red/50 rounded-xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-rpm-white">Delete {c.name}?</h3>
            <p className="text-sm text-rpm-silver mt-2">
              This permanently removes the customer plus all their vehicles, quotes, jobs, photos, and unpaid invoices. <span className="text-rpm-red font-semibold">This cannot be undone.</span>
            </p>
            <p className="text-xs text-rpm-silver mt-3">Type <span className="font-mono text-rpm-white">DELETE</span> to confirm:</p>
            <input
              autoFocus
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white font-mono"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
              <button
                onClick={doDelete}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'amber' | 'red' }) {
  const tone = accent === 'amber' ? 'text-amber-400' : accent === 'red' ? 'text-rpm-red' : 'text-rpm-white';
  return (
    <div className="rounded-lg border border-rpm-gray/40 bg-rpm-charcoal/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-rpm-silver">{label}</div>
      <div className={`text-lg font-black tabular-nums mt-0.5 ${tone}`}>{value}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-lg border border-dashed border-rpm-gray/40 p-3 text-xs text-rpm-silver/60 italic">{msg}</div>;
}
