'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { sendJobStatus, sendReminderEmail, CUSTOMER_PORTAL_URL } from '@/lib/email-client';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';
import JobPhotoUploader from '@/components/portal/JobPhotoUploader';

interface PendingReminder {
  id: string;
  type: 'ceramic_refresh' | 'ppf_check' | 'tint_warranty' | 'general_rebook' | 'promotional';
  dueAt: string;
  customMessage?: string | null;
  user: { id: string; email: string; name: string };
  vehicle?: { id: string; year: number; make: string; model: string; trim?: string | null } | null;
}

interface UserRef { id: string; email: string; name: string }
interface Vehicle { id: string; year: number; make: string; model: string; trim?: string | null }
interface Customer { id: string; email: string; name: string; phone?: string | null; createdAt: string; _count: { vehicles: number; quotes: number; jobs: number } }
interface JobEvent { id: string; toStatus: string; at: string; note?: string | null }
interface Quote {
  id: string;
  services: string[];
  estimatedTotal: number;
  quotedAmount?: number | null;
  status: 'submitted' | 'quoted' | 'approved' | 'converted' | 'declined';
  submittedAt: string;
  user: UserRef;
  vehicle: Vehicle;
  depositAmount?: number | null;
  stripePaymentLinkUrl?: string | null;
  depositPaidAt?: string | null;
}
interface Job {
  id: string;
  services: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
  updatedAt: string;
  user: UserRef;
  vehicle: Vehicle;
  events: JobEvent[];
  photos: JobPhoto[];
  adminNote?: string | null;
  quoteId?: string | null;
  scheduledAt?: string | null;
}

interface Overview { customers: Customer[]; quotes: Quote[]; jobs: Job[] }

const JOB_FLOW: Job['status'][] = ['scheduled', 'in_progress', 'completed', 'picked_up'];

const label = (s: string) => {
  switch (s) {
    case 'in_progress': return 'In Progress';
    case 'picked_up': return 'Picked Up';
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
};

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<'customers' | 'quotes' | 'jobs'>('jobs');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<Overview>('/api/admin/overview');
    if (!res.ok) setErr(res.error || 'Failed to load');
    else setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Admin</h1>
        <p className="text-rpm-silver mt-1">All customers, quotes, and jobs.</p>
      </header>

      <div className="flex items-center gap-2 border-b border-rpm-gray/40">
        {(['jobs', 'quotes', 'customers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px',
              tab === t
                ? 'text-rpm-red border-rpm-red'
                : 'text-rpm-silver border-transparent hover:text-rpm-white'
            )}
          >
            {t} ({data[t].length})
          </button>
        ))}
      </div>

      <RemindersPanel />

      {tab === 'jobs' && <JobsTab jobs={data.jobs} onChange={load} />}
      {tab === 'quotes' && <QuotesTab quotes={data.quotes} customers={data.customers} onChange={load} />}
      {tab === 'customers' && <CustomersTab customers={data.customers} />}
    </div>
  );
}

function RemindersPanel() {
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ reminders: PendingReminder[] }>('/api/admin/reminders/pending');
    if (res.ok) setReminders(res.data?.reminders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(
    async (r: PendingReminder) => {
      setBusyId(r.id);
      const veh = r.vehicle
        ? [r.vehicle.year, r.vehicle.make, r.vehicle.model].filter(Boolean).join(' ')
        : 'your vehicle';
      try {
        await sendReminderEmail({
          to: r.user.email,
          name: r.user.name,
          vehicle: veh,
          type: r.type,
          customMessage: r.customMessage,
          portalUrl: CUSTOMER_PORTAL_URL,
        });
        await api.patch(`/api/admin/reminders/${r.id}`, { action: 'sent' });
      } catch (e) {
        alert(`Send failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      setBusyId(null);
      load();
    },
    [load]
  );

  const cancel = async (r: PendingReminder) => {
    setBusyId(r.id);
    await api.patch(`/api/admin/reminders/${r.id}`, { action: 'cancel' });
    setBusyId(null);
    load();
  };

  const sendAll = async () => {
    if (!window.confirm(`Send all ${reminders.length} pending reminders?`)) return;
    for (const r of reminders) {
      await send(r);
    }
  };

  if (loading || reminders.length === 0) return null;

  const labelMap: Record<PendingReminder['type'], string> = {
    ceramic_refresh: 'Ceramic refresh',
    ppf_check: 'PPF check',
    tint_warranty: 'Tint warranty',
    general_rebook: 'Rebook nudge',
    promotional: 'Promotional',
  };

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <header className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            Pending reminders ({reminders.length})
          </h3>
          <p className="text-xs text-rpm-silver mt-0.5">
            These follow-ups are due. Send them now, or cancel any you want to skip.
          </p>
        </div>
        <button
          onClick={sendAll}
          className="px-3 py-2 rounded-lg bg-amber-500 text-rpm-black text-sm font-bold hover:bg-amber-400"
        >
          Send all
        </button>
      </header>
      <ul className="space-y-1.5">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-rpm-charcoal/60 border border-rpm-gray/40 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="text-rpm-white font-semibold truncate">
                {r.user.name} — {labelMap[r.type]}
              </div>
              <div className="text-xs text-rpm-silver/80 truncate">
                {r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : ''} · due {new Date(r.dueAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => send(r)}
                disabled={busyId === r.id}
                className="px-2.5 py-1 rounded-md bg-rpm-red text-white text-xs font-bold hover:bg-rpm-red-dark disabled:opacity-50"
              >
                {busyId === r.id ? '…' : 'Send'}
              </button>
              <button
                onClick={() => cancel(r)}
                disabled={busyId === r.id}
                className="px-2.5 py-1 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-red hover:border-rpm-red disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function JobsTab({ jobs, onChange }: { jobs: Job[]; onChange: () => void }) {
  if (jobs.length === 0) return <Empty message="No jobs yet. Convert a quote to create the first one." />;
  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} onChange={onChange} />
      ))}
    </div>
  );
}

function JobCard({ job, onChange }: { job: Job; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const current = JOB_FLOW.indexOf(job.status as Job['status']);
  const nextStatus = current >= 0 && current < JOB_FLOW.length - 1 ? JOB_FLOW[current + 1] : null;

  const vehicleStr = [job.vehicle.year, job.vehicle.make, job.vehicle.model, job.vehicle.trim]
    .filter(Boolean)
    .join(' ');

  const emailCustomer = (newStatus: string, noteText?: string) =>
    sendJobStatus({
      to: job.user.email,
      name: job.user.name,
      vehicle: vehicleStr,
      newStatus,
      note: noteText,
      portalUrl: CUSTOMER_PORTAL_URL,
    }).catch((e) => console.error('[email] job status failed:', e));

  const advance = async () => {
    if (!nextStatus) return;
    setBusy(true);
    const res = await api.patch(`/api/admin/jobs/${job.id}/status`, { status: nextStatus, note: note || undefined });
    if (res.ok) await emailCustomer(nextStatus, note || undefined);
    setBusy(false);
    setNote('');
    onChange();
  };

  const cancel = async () => {
    if (!window.confirm('Mark this job as cancelled?')) return;
    setBusy(true);
    const res = await api.patch(`/api/admin/jobs/${job.id}/status`, { status: 'cancelled', note: note || 'Cancelled' });
    if (res.ok) await emailCustomer('cancelled', note || 'Cancelled');
    setBusy(false);
    setNote('');
    onChange();
  };

  return (
    <div className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <div className="text-base font-black text-rpm-white">
            {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
          </div>
          <div className="text-xs text-rpm-silver mt-0.5">{job.services.join(' + ')}</div>
          <div className="text-xs text-rpm-silver/70 mt-1">
            {job.user.name} — {job.user.email}
          </div>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-rpm-red/30 text-rpm-red bg-rpm-red/10">
          {label(job.status)}
        </div>
      </div>

      {job.status !== 'cancelled' && job.status !== 'picked_up' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the customer…"
            className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/50 focus:outline-none focus:border-rpm-red"
          />
          {nextStatus && (
            <button
              onClick={advance}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50"
            >
              Advance → {label(nextStatus)}
            </button>
          )}
          <button
            onClick={cancel}
            disabled={busy}
            className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-red hover:border-rpm-red disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <JobPhotoUploader jobId={job.id} onUploaded={onChange} />
        {job.photos.length > 0 && (
          <PhotoGallery
            photos={job.photos}
            onDelete={async (pid) => {
              await api.delete(`/api/admin/jobs/${job.id}/photos/${pid}`);
              onChange();
            }}
          />
        )}
      </div>
    </div>
  );
}

function QuotesTab({ quotes, customers, onChange }: { quotes: Quote[]; customers: Customer[]; onChange: () => void }) {
  if (quotes.length === 0) return <Empty message="No quotes yet." />;
  return (
    <div className="space-y-3">
      {quotes.map((q) => (
        <QuoteCard key={q.id} quote={q} customers={customers} onChange={onChange} />
      ))}
    </div>
  );
}

function QuoteCard({ quote, onChange }: { quote: Quote; customers: Customer[]; onChange: () => void }) {
  const [amount, setAmount] = useState<string>(quote.quotedAmount ? String(quote.quotedAmount) : '');
  const [busy, setBusy] = useState(false);

  const saveQuote = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return;
    setBusy(true);
    await api.patch(`/api/admin/quotes/${quote.id}`, { quotedAmount: Math.round(n), status: 'quoted' });
    setBusy(false);
    onChange();
  };

  const convertToJob = async () => {
    setBusy(true);
    await api.post('/api/admin/jobs', {
      userId: quote.user.id,
      vehicleId: quote.vehicle.id,
      quoteId: quote.id,
      services: quote.services,
      adminNote: 'Converted from quote',
    });
    setBusy(false);
    onChange();
  };

  return (
    <div className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-5">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <div className="text-base font-black text-rpm-white">
            {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
          </div>
          <div className="text-xs text-rpm-silver mt-0.5">{quote.services.join(' + ')}</div>
          <div className="text-xs text-rpm-silver/70 mt-1">
            {quote.user.name} — {quote.user.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-rpm-silver">Estimated</div>
          <div className="text-lg font-black text-rpm-white">${quote.estimatedTotal.toLocaleString()}</div>
          <div className="text-xs text-rpm-red font-bold uppercase mt-1">{label(quote.status)}</div>
        </div>
      </div>

      {quote.status !== 'converted' && quote.status !== 'declined' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-rpm-silver">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Final quote (est. ${quote.estimatedTotal})`}
              className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/50 focus:outline-none focus:border-rpm-red"
            />
          </div>
          <button
            onClick={saveQuote}
            disabled={busy || !amount}
            className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50"
          >
            Save quote
          </button>
          <button
            onClick={convertToJob}
            disabled={busy}
            className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-white hover:border-emerald-500/60 hover:text-emerald-400 disabled:opacity-50"
          >
            Convert to job
          </button>
        </div>
      )}

      {quote.quotedAmount && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {!quote.stripePaymentLinkUrl ? (
            <button
              onClick={async () => {
                setBusy(true);
                const res = await api.post<{ paymentLinkUrl: string }>(`/api/admin/quotes/${quote.id}/payment-link`, {});
                setBusy(false);
                if (!res.ok) {
                  alert(res.error || 'Could not generate payment link');
                  return;
                }
                onChange();
              }}
              disabled={busy}
              className="px-3 py-2 rounded-lg border border-emerald-500/40 text-sm text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              Generate deposit link (25%)
            </button>
          ) : (
            <>
              <a
                href={quote.stripePaymentLinkUrl}
                target="_blank"
                rel="noopener"
                className="text-xs text-rpm-silver hover:text-rpm-white truncate max-w-[200px]"
              >
                {quote.stripePaymentLinkUrl}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(quote.stripePaymentLinkUrl!);
                  alert('Link copied');
                }}
                className="px-2 py-1 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white"
              >
                Copy
              </button>
              {quote.depositPaidAt ? (
                <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Paid {new Date(quote.depositPaidAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Awaiting deposit
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CustomersTab({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) return <Empty message="No customers yet." />;
  return (
    <div className="rounded-xl border border-rpm-gray/50 bg-rpm-dark overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-rpm-charcoal/60 text-xs uppercase tracking-wider text-rpm-silver">
          <tr>
            <th className="text-left p-3">Customer</th>
            <th className="text-left p-3">Email</th>
            <th className="text-right p-3">Vehicles</th>
            <th className="text-right p-3">Quotes</th>
            <th className="text-right p-3">Jobs</th>
            <th className="text-right p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-t border-rpm-gray/30">
              <td className="p-3 text-rpm-white font-semibold">{c.name}</td>
              <td className="p-3 text-rpm-silver">{c.email}</td>
              <td className="p-3 text-right tabular-nums">{c._count.vehicles}</td>
              <td className="p-3 text-right tabular-nums">{c._count.quotes}</td>
              <td className="p-3 text-right tabular-nums">{c._count.jobs}</td>
              <td className="p-3 text-right text-rpm-silver/80">{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
      {message}
    </div>
  );
}
