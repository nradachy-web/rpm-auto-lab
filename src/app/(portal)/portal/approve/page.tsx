'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';

interface ChangeOrder {
  id: string;
  description: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
  photoUrl?: string | null;
  status: 'pending' | 'approved' | 'declined' | 'voided';
}
interface JobBrief {
  id: string;
  vehicle: { year: number; make: string; model: string };
  customerName: string;
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function ApprovePage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <ApproveInner />
    </Suspense>
  );
}

function ApproveInner() {
  const params = useSearchParams();
  const token = params?.get('token') ?? '';
  const [co, setCo] = useState<ChangeOrder | null>(null);
  const [job, setJob] = useState<JobBrief | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'approved' | 'declined' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await api.get<{ changeOrder: ChangeOrder; job: JobBrief }>(`/api/portal/change-orders/${token}`);
      if (!res.ok) setErr(res.error || 'Invalid link');
      else {
        setCo(res.data?.changeOrder ?? null);
        setJob(res.data?.job ?? null);
      }
    })();
  }, [token]);

  const act = async (action: 'approve' | 'decline') => {
    setBusy(true);
    const res = await api.post<{ ok: boolean; status: string }>(`/api/portal/change-orders/${token}`, {
      action,
      declineReason: action === 'decline' ? (reason || undefined) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Could not record your response');
      return;
    }
    setDone(action === 'approve' ? 'approved' : 'declined');
  };

  if (!token) return <div className="max-w-md mx-auto py-12 text-rpm-red">Missing token.</div>;
  if (err) return <div className="max-w-md mx-auto py-12 text-rpm-red">{err}</div>;
  if (!co || !job) return <div className="max-w-md mx-auto py-12 text-rpm-silver">Loading…</div>;

  if (done) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <div className="text-5xl">{done === 'approved' ? '✅' : '✋'}</div>
        <h1 className="text-2xl font-black text-rpm-white">
          {done === 'approved' ? 'Approved — thank you!' : 'Got it, no problem.'}
        </h1>
        <p className="text-rpm-silver">
          {done === 'approved'
            ? 'We\'ll add this to your invoice and proceed.'
            : 'We\'ll skip this and continue with the original scope.'}
        </p>
      </div>
    );
  }

  if (co.status !== 'pending') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <h1 className="text-2xl font-black text-rpm-white">Already responded</h1>
        <p className="text-rpm-silver">This change order is marked <span className="text-rpm-white font-semibold">{co.status}</span>.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 space-y-5">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-rpm-red font-bold">Approval needed</div>
        <h1 className="text-2xl font-black text-rpm-white mt-1">
          Hi {job.customerName.split(' ')[0]} —
        </h1>
        <p className="text-rpm-silver">
          We found something on your <strong className="text-rpm-white">{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</strong> that needs your call before we proceed.
        </p>
      </header>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        {co.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={co.photoUrl} alt="" className="w-full rounded-lg" />
        )}
        <div>
          <h2 className="text-base font-bold text-rpm-white">{co.description}</h2>
          <div className="text-sm text-rpm-silver">{co.quantity} × {$(co.unitCents)}</div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-rpm-gray/30">
          <span className="text-xs uppercase tracking-wider text-rpm-silver">Added cost</span>
          <span className="text-2xl font-black text-rpm-white tabular-nums">{$(co.totalCents)}</span>
        </div>
      </section>

      <section className="space-y-2">
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason (only required if declining)"
          className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => act('decline')} disabled={busy} className="px-4 py-3 rounded-lg border border-rpm-gray text-rpm-silver hover:text-rpm-red hover:border-rpm-red disabled:opacity-50 flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Decline
          </button>
          <button onClick={() => act('approve')} disabled={busy} className="px-4 py-3 rounded-lg bg-rpm-red text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Approve
          </button>
        </div>
      </section>
    </div>
  );
}
