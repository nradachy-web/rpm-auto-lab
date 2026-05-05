'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { sendWelcomeQuote, sendAdminQuoteAlert, CUSTOMER_PORTAL_URL, SHOP_INBOX } from '@/lib/email-client';
import PartsDiagram, { type DiagramValue } from '@/components/portal/PartsDiagram';

type SizeTier = 'compact' | 'sedan' | 'suv' | 'truck' | 'oversize' | 'motorcycle' | 'boat' | 'rv';

interface CatalogPackage { slug: string; name: string; basePrice: number }
interface CatalogCategory { id: string; name: string; packages: CatalogPackage[] }

const SIZE_TIERS: { value: SizeTier; label: string }[] = [
  { value: 'compact', label: 'Compact car' },
  { value: 'sedan', label: 'Sedan / Coupe' },
  { value: 'suv', label: 'SUV / Crossover' },
  { value: 'truck', label: 'Truck' },
  { value: 'oversize', label: 'Oversize / Van' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'boat', label: 'Boat' },
  { value: 'rv', label: 'RV' },
];

type Source = 'google' | 'facebook' | 'instagram' | 'referral' | 'website' | 'phone' | 'walkin' | 'in_person' | 'other';
const SOURCES: { value: Source; label: string }[] = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
];

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <NewQuoteInner />
    </Suspense>
  );
}

function NewQuoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [sizeTier, setSizeTier] = useState<SizeTier>('sedan');
  const [services, setServices] = useState<Set<string>>(new Set());
  const [quotedAmount, setQuotedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<Source>('phone');
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [busy, setBusy] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);
  // Optional same-step scheduling
  const [scheduleNow, setScheduleNow] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDuration, setScheduleDuration] = useState('120');
  // PPF/coating coverage diagram + multi-package options
  const [coverage, setCoverage] = useState<DiagramValue>({});
  const [showDiagram, setShowDiagram] = useState(false);
  const [extraOptions, setExtraOptions] = useState<{ name: string; price: string; recommended: boolean }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ categories: CatalogCategory[] }>('/api/catalog');
      if (res.ok) setPackages((res.data?.categories ?? []).flatMap((c) => c.packages));
    })();
  }, []);

  // If linked from the schedule with a date+time, prefill the schedule fields.
  useEffect(() => {
    const date = params?.get('date');
    const time = params?.get('time');
    if (date) {
      setScheduleNow(true);
      setScheduleDate(date);
      if (time) setScheduleTime(time);
    }
  }, [params]);

  // If linked from a customer detail slide-over, prefill customer fields.
  useEffect(() => {
    const customerId = params?.get('customer');
    if (!customerId) return;
    (async () => {
      const res = await api.get<{ customer: { name: string; email: string; phone?: string | null } }>(`/api/admin/customers/${customerId}`);
      if (res.ok && res.data?.customer) {
        setName(res.data.customer.name);
        setEmail(res.data.customer.email);
        if (res.data.customer.phone) setPhone(res.data.customer.phone);
      }
    })();
  }, [params]);

  const decodeVin = async () => {
    if (vin.trim().length < 11) return;
    setVinDecoding(true);
    const res = await api.get<{ year: number | null; make: string | null; model: string | null; trim: string | null }>(`/api/vin/${encodeURIComponent(vin.trim())}`);
    setVinDecoding(false);
    if (res.ok && res.data) {
      if (res.data.year) setYear(String(res.data.year));
      if (res.data.make) setMake(res.data.make);
      if (res.data.model) setModel(res.data.model);
      if (res.data.trim) setTrim(res.data.trim);
    }
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !year || !make || !model || services.size === 0 || !quotedAmount) {
      alert('Please fill in name, email, phone, vehicle, services, and price.');
      return;
    }
    setBusy(true);
    const res = await api.post<{
      ok: boolean;
      quoteId: string;
      setPasswordUrl: string | null;
      portalUrl: string;
      publicQuoteUrl?: string;
    }>('/api/admin/quotes/walk-in', {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      vehicle: {
        year: parseInt(year),
        make: make.trim(),
        model: model.trim(),
        trim: trim.trim() || undefined,
        color: color.trim() || undefined,
        licensePlate: licensePlate.trim() || undefined,
        vin: vin.trim() || undefined,
        sizeTier,
      },
      services: Array.from(services),
      quotedAmount: parseInt(quotedAmount),
      notes: notes.trim() || undefined,
      source,
      partsDiagram: Object.keys(coverage).length > 0 ? coverage : undefined,
      options: extraOptions
        .filter((o) => o.name.trim() && o.price)
        .map((o) => ({
          name: o.name.trim(),
          priceCents: Math.round(parseFloat(o.price) * 100) || 0,
          recommended: o.recommended,
        })),
      schedule: scheduleNow && scheduleDate
        ? {
            startAt: new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString(),
            durationMinutes: parseInt(scheduleDuration) || 120,
          }
        : undefined,
    });
    if (!res.ok || !res.data) {
      setBusy(false);
      alert(res.error || 'Failed to create quote');
      return;
    }
    // Fire emails client-side via Web3Forms (server-side blocked on free).
    const vehicleStr = [year, make, model, trim].filter(Boolean).join(' ');
    const summary = `${vehicleStr}\nServices: ${Array.from(services).join(', ')}\nQuoted: $${parseInt(quotedAmount).toLocaleString()}`;
    let emailFailed = false;
    try {
      await sendWelcomeQuote({
        to: email,
        name,
        setPasswordUrl: res.data.setPasswordUrl,
        quoteSummary: summary,
        portalUrl: CUSTOMER_PORTAL_URL,
        publicQuoteUrl: res.data.publicQuoteUrl ?? null,
      });
      await sendAdminQuoteAlert({
        to: SHOP_INBOX,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        vehicle: vehicleStr,
        services: Array.from(services),
        estimatedTotal: parseInt(quotedAmount),
        notes: notes || undefined,
      });
    } catch (e) {
      console.warn('Email send failed:', e);
      emailFailed = true;
    }
    setBusy(false);
    if (emailFailed) {
      alert(
        `Quote saved, but the customer email failed to send. ` +
        `You may want to follow up manually at ${email}.`
      );
    }
    router.push('/portal/admin');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <Phone className="w-6 h-6 text-rpm-red" />
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">New quote</h1>
          <p className="text-rpm-silver mt-1">Phone or walk-in. Customer gets the quote by email automatically.</p>
        </div>
      </header>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-rpm-silver">How did they find us?</span>
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSource(s.value)}
              className={
                'px-2.5 py-1 rounded-full text-[11px] font-bold border ' +
                (source === s.value ? 'bg-rpm-red/15 border-rpm-red text-rpm-red' : 'border-rpm-gray text-rpm-silver hover:text-rpm-white')
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Vehicle</h2>
          <div className="flex items-center gap-1">
            <input value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="VIN (optional, auto-fills)" className="px-2 py-1 rounded-md bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white font-mono w-56" />
            <button
              type="button"
              onClick={decodeVin}
              disabled={vinDecoding || vin.trim().length < 11}
              title={vin.trim().length < 11 ? 'Enter at least 11 characters of the VIN' : 'Decode via NHTSA'}
              className="px-2 py-1 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white disabled:opacity-50"
            >
              {vinDecoding ? '…' : 'Decode'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="Trim" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} placeholder="Plate" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <select value={sizeTier} onChange={(e) => setSizeTier(e.target.value as SizeTier)} className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white">
            {SIZE_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Services + price</h2>
        <div className="flex flex-wrap gap-1.5">
          {packages.map((p) => {
            const sel = services.has(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  const n = new Set(services);
                  if (sel) n.delete(p.slug); else n.add(p.slug);
                  setServices(n);
                }}
                className={
                  'px-2.5 py-1.5 rounded-full text-xs border ' +
                  (sel ? 'bg-rpm-red/15 border-rpm-red text-rpm-red' : 'border-rpm-gray text-rpm-silver hover:text-rpm-white')
                }
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-rpm-silver">$</span>
          <input type="number" value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} placeholder="Quoted price (whole dollars)" className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </div>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the customer + shop record" className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none" />
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Coverage diagram (optional)</h2>
          <button type="button" onClick={() => setShowDiagram(!showDiagram)} className="text-xs text-rpm-silver hover:text-rpm-white">
            {showDiagram ? 'Hide' : Object.keys(coverage).length > 0 ? `${Object.keys(coverage).length} panels — Edit` : 'Add'}
          </button>
        </header>
        {showDiagram && (
          <div>
            <p className="text-xs text-rpm-silver mb-2">Mark which panels are covered. Customer sees this on their quote.</p>
            <PartsDiagram value={coverage} onChange={setCoverage} />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Alternative packages (optional)</h2>
          <button type="button" onClick={() => setExtraOptions([...extraOptions, { name: '', price: '', recommended: false }])} className="text-xs text-rpm-silver hover:text-rpm-white">
            + Add another option
          </button>
        </header>
        <p className="text-xs text-rpm-silver">
          Customer compares packages side-by-side and picks one. The price above stays the default.
        </p>
        <div className="space-y-2">
          {extraOptions.map((o, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input value={o.name} onChange={(e) => {
                const n = [...extraOptions]; n[idx].name = e.target.value; setExtraOptions(n);
              }} placeholder="Option name (e.g. Front End PPF)" className="col-span-6 px-3 py-1.5 rounded-md bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
              <div className="col-span-3 flex items-center gap-1">
                <span className="text-rpm-silver text-sm">$</span>
                <input type="number" value={o.price} onChange={(e) => {
                  const n = [...extraOptions]; n[idx].price = e.target.value; setExtraOptions(n);
                }} placeholder="Price" className="flex-1 px-2 py-1.5 rounded-md bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
              </div>
              <label className="col-span-2 text-[11px] text-rpm-silver flex items-center gap-1">
                <input type="checkbox" checked={o.recommended} onChange={(e) => {
                  const n = [...extraOptions]; n[idx].recommended = e.target.checked; setExtraOptions(n);
                }} />
                Recommend
              </label>
              <button type="button" onClick={() => setExtraOptions(extraOptions.filter((_, i) => i !== idx))} className="col-span-1 text-rpm-silver hover:text-rpm-red text-xs">
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={scheduleNow} onChange={(e) => setScheduleNow(e.target.checked)} className="w-4 h-4 accent-rpm-red" />
          <span className="text-sm font-bold text-rpm-white">Schedule it now</span>
          <span className="text-xs text-rpm-silver">Creates the job too — appears on Today + Schedule.</span>
        </label>
        {scheduleNow && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-6">
            <label className="text-xs text-rpm-silver">
              Date
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
            <label className="text-xs text-rpm-silver">
              Time
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
            <label className="text-xs text-rpm-silver">
              Duration (min)
              <input type="number" min={15} step={15} value={scheduleDuration} onChange={(e) => setScheduleDuration(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            </label>
          </div>
        )}
      </section>

      <footer className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="px-3 py-2 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold hover:bg-rpm-red-dark disabled:opacity-50 flex items-center gap-2">
          <Send className="w-4 h-4" />
          {busy ? 'Sending…' : 'Save + send to customer'}
        </button>
      </footer>
    </div>
  );
}
