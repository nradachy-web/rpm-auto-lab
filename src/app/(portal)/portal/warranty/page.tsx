'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Printer, Smartphone } from 'lucide-react';
import { api, API_BASE } from '@/lib/api';
import { BASE_PATH } from '@/lib/constants';

interface Coverage { name: string; years: number }
interface WarrantyData {
  job: { id: string; services: string[]; status: string };
  customer: { firstName: string };
  vehicle: { year: number; make: string; model: string; trim?: string | null };
  installedAt: string;
  coverage: Coverage[];
}

const yearsLabel = (y: number) => (y >= 99 ? 'Lifetime' : `${y} year${y === 1 ? '' : 's'}`);

export default function WarrantyPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <WarrantyInner />
    </Suspense>
  );
}

function WarrantyInner() {
  const params = useSearchParams();
  const jobId = params?.get('job') ?? '';
  const [data, setData] = useState<WarrantyData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      const res = await api.get<WarrantyData>(`/api/warranty/${jobId}`);
      if (!res.ok) setErr(res.error || 'Not found');
      else setData(res.data);
    })();
  }, [jobId]);

  if (!jobId) return <div className="max-w-md mx-auto py-12 text-rpm-red">Missing ?job=…</div>;
  if (err) return <div className="max-w-md mx-auto py-12 text-rpm-red">{err}</div>;
  if (!data) return <div className="max-w-md mx-auto py-12 text-rpm-silver">Loading…</div>;

  const installed = new Date(data.installedAt);
  const longest = Math.max(...data.coverage.map((c) => c.years));
  const expires = new Date(installed);
  if (longest >= 99) expires.setFullYear(expires.getFullYear() + 99);
  else expires.setFullYear(expires.getFullYear() + longest);

  return (
    <div className="max-w-md mx-auto py-6 space-y-5 print:py-0">
      <div className="rounded-2xl border border-rpm-red/40 bg-gradient-to-br from-rpm-red/10 to-rpm-charcoal p-6 print:bg-white print:text-black print:border-black">
        <header className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-rpm-red" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-rpm-red font-bold">Warranty card</div>
            <h1 className="text-2xl font-black text-rpm-white print:text-black">RPM Auto Lab</h1>
          </div>
        </header>

        <dl className="mt-5 space-y-3 text-sm">
          <Row k="Customer" v={data.customer.firstName} />
          <Row k="Vehicle" v={`${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}${data.vehicle.trim ? ' ' + data.vehicle.trim : ''}`} />
          <Row k="Installed" v={installed.toLocaleDateString()} />
          <Row k="Coverage thru" v={longest >= 99 ? 'Lifetime' : expires.toLocaleDateString()} />
        </dl>

        <div className="mt-5 pt-4 border-t border-rpm-gray/40 print:border-black">
          <div className="text-[10px] uppercase tracking-wider text-rpm-silver print:text-gray-600 font-bold mb-2">Coverage</div>
          <ul className="space-y-1.5 text-sm">
            {data.coverage.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="text-rpm-white print:text-black">{c.name}</span>
                <span className="text-rpm-red font-bold">{yearsLabel(c.years)}</span>
              </li>
            ))}
            {data.coverage.length === 0 && <li className="text-rpm-silver/70 italic">No warranted service on this job.</li>}
          </ul>
        </div>

        <div className="mt-5 text-[11px] text-rpm-silver/80 print:text-gray-600 leading-relaxed">
          Coverage applies to product defects under normal use. Show this card on file or via the URL below.
          Reference job: {data.job.id}.
        </div>
      </div>

      <section className="print:hidden flex flex-wrap gap-2">
        <button onClick={() => window.print()} className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1">
          <Printer className="w-4 h-4" /> Print
        </button>
        {data.job.services.map((slug) => (
          <a
            key={slug}
            href={`${API_BASE}/api/portal/aftercare/${slug}?name=${encodeURIComponent(data.customer.firstName)}&vehicle=${encodeURIComponent(`${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`)}`}
            target="_blank"
            rel="noopener"
            className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1"
          >
            Aftercare ({slug.replace(/-/g, ' ')})
          </a>
        ))}
        <a
          href={`${BASE_PATH}/portal/warranty?job=${data.job.id}`}
          className="px-3 py-2 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white flex items-center gap-1"
        >
          <Smartphone className="w-4 h-4" /> Save link to phone
        </a>
      </section>

      <p className="print:hidden text-[11px] text-rpm-silver/60 text-center">
        Add this page to your phone&apos;s home screen for quick access. Apple Wallet / Google Wallet pass coming soon.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-rpm-silver print:text-gray-600 font-bold">{k}</dt>
      <dd className="text-rpm-white print:text-black font-semibold text-right">{v}</dd>
    </div>
  );
}
