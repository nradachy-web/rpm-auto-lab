'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { api } from '@/lib/api';
import SignaturePad from '@/components/portal/SignaturePad';
import JobPhotoUploader from '@/components/portal/JobPhotoUploader';
import PhotoGallery, { type JobPhoto } from '@/components/portal/PhotoGallery';

interface JobBrief {
  id: string;
  user: { name: string; email: string; phone?: string | null };
  vehicle: { year: number; make: string; model: string; trim?: string | null; licensePlate?: string | null };
  photos: JobPhoto[];
}

interface Intake {
  id: string;
  jobId: string;
  mileage: number | null;
  fuelLevelEighths: number | null;
  keyCount: number | null;
  customerNotes: string | null;
  shopNotes: string | null;
  signatureDataUrl: string | null;
  signedByName: string | null;
  signedAt: string | null;
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <IntakeInner />
    </Suspense>
  );
}

function IntakeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params?.get('job') ?? '';
  const [job, setJob] = useState<JobBrief | null>(null);
  const [mileage, setMileage] = useState('');
  const [fuel, setFuel] = useState('4');
  const [keys, setKeys] = useState('1');
  const [customerNotes, setCustomerNotes] = useState('');
  const [shopNotes, setShopNotes] = useState('');
  const [signedByName, setSignedByName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      const [overview, intakeRes] = await Promise.all([
        api.get<{ jobs: JobBrief[] }>('/api/admin/overview'),
        api.get<{ intake: Intake | null }>(`/api/admin/jobs/${jobId}/intake`),
      ]);
      const found = overview.data?.jobs.find((j) => j.id === jobId);
      if (found) setJob(found);
      if (intakeRes.ok && intakeRes.data?.intake) {
        const i = intakeRes.data.intake;
        if (i.mileage != null) setMileage(String(i.mileage));
        if (i.fuelLevelEighths != null) setFuel(String(i.fuelLevelEighths));
        if (i.keyCount != null) setKeys(String(i.keyCount));
        if (i.customerNotes) setCustomerNotes(i.customerNotes);
        if (i.shopNotes) setShopNotes(i.shopNotes);
        if (i.signatureDataUrl) setSignature(i.signatureDataUrl);
        if (i.signedByName) setSignedByName(i.signedByName);
      }
    })();
  }, [jobId]);

  const refreshJob = async () => {
    const overview = await api.get<{ jobs: JobBrief[] }>('/api/admin/overview');
    const found = overview.data?.jobs.find((j) => j.id === jobId);
    if (found) setJob(found);
  };

  const save = async (markSigned: boolean) => {
    setBusy(true);
    const res = await api.post(`/api/admin/jobs/${jobId}/intake`, {
      mileage: mileage ? parseInt(mileage) : null,
      fuelLevelEighths: parseInt(fuel),
      keyCount: parseInt(keys),
      customerNotes: customerNotes || null,
      shopNotes: shopNotes || null,
      signatureDataUrl: signature,
      signedByName: signedByName || null,
      signedAt: markSigned && signature ? new Date().toISOString() : null,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Save failed');
      return;
    }
    setSavedAt(new Date());
    if (markSigned) router.push('/portal/admin');
  };

  if (!jobId) {
    return <div className="text-rpm-red text-sm">Missing ?job=… in the URL.</div>;
  }
  if (!job) return <div className="text-rpm-silver text-sm">Loading job…</div>;

  const beforePhotos = job.photos.filter((p) => p.stage === 'before');

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <ClipboardCheck className="w-6 h-6 text-rpm-red" />
        <div>
          <h1 className="text-3xl font-black text-rpm-white">Drop-off intake</h1>
          <p className="text-rpm-silver mt-0.5 text-sm">{job.vehicle.year} {job.vehicle.make} {job.vehicle.model} · {job.user.name}</p>
        </div>
      </header>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Vehicle condition</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <label className="text-xs text-rpm-silver">
            Mileage
            <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 12500" className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </label>
          <label className="text-xs text-rpm-silver">
            Fuel level (eighths 0-8)
            <input type="number" min={0} max={8} value={fuel} onChange={(e) => setFuel(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </label>
          <label className="text-xs text-rpm-silver">
            Key count
            <input type="number" min={0} max={10} value={keys} onChange={(e) => setKeys(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Damage walkthrough</h2>
        <p className="text-xs text-rpm-silver">Take photos around the entire vehicle — front, both sides, rear, wheels, interior. Anything pre-existing protects you and the customer.</p>
        <JobPhotoUploader jobId={jobId} onUploaded={refreshJob} />
        {beforePhotos.length > 0 && (
          <PhotoGallery photos={beforePhotos} />
        )}
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Notes</h2>
        <textarea rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Customer-stated concerns ('check passenger door dent')" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none" />
        <textarea rows={2} value={shopNotes} onChange={(e) => setShopNotes(e.target.value)} placeholder="Shop notes (private)" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none" />
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Customer signature</h2>
        <input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Customer's printed name" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <SignaturePad initialData={signature} onChange={setSignature} />
        <p className="text-[10px] text-rpm-silver/70">Signing acknowledges the documented vehicle condition and authorizes the listed services.</p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-rpm-silver space-y-0.5">
          {savedAt && <div>Saved {savedAt.toLocaleTimeString()}</div>}
          {(beforePhotos.length === 0 || !signature || !signedByName.trim()) && (
            <div className="text-amber-400">
              Need to complete: {[
                beforePhotos.length === 0 && 'at least 1 photo',
                !signature && 'signature',
                !signedByName.trim() && 'printed name',
              ].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={busy} className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white disabled:opacity-50">
            Save draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={busy || !signature || !signedByName.trim() || beforePhotos.length === 0}
            title={beforePhotos.length === 0 ? 'Add at least one walkaround photo first' : 'Save the signed intake'}
            className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Sign + complete'}
          </button>
        </div>
      </footer>
    </div>
  );
}
