'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { sendWelcomeQuote, sendAdminQuoteAlert, CUSTOMER_PORTAL_URL, SHOP_INBOX } from '@/lib/email-client';

type SizeTier = 'compact' | 'sedan' | 'suv' | 'truck' | 'oversize';

interface CatalogPackage { slug: string; name: string; basePrice: number }
interface CatalogCategory { id: string; name: string; packages: CatalogPackage[] }

const SIZE_TIERS: SizeTier[] = ['compact', 'sedan', 'suv', 'truck', 'oversize'];

export default function NewQuotePage() {
  const router = useRouter();
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
  const [source, setSource] = useState<'phone' | 'walkin' | 'referral' | 'in_person'>('phone');
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [busy, setBusy] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ categories: CatalogCategory[] }>('/api/catalog');
      if (res.ok) setPackages((res.data?.categories ?? []).flatMap((c) => c.packages));
    })();
  }, []);

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
    });
    if (!res.ok || !res.data) {
      setBusy(false);
      alert(res.error || 'Failed to create quote');
      return;
    }
    // Fire emails client-side via Web3Forms (server-side blocked on free).
    const vehicleStr = [year, make, model, trim].filter(Boolean).join(' ');
    const summary = `${vehicleStr}\nServices: ${Array.from(services).join(', ')}\nQuoted: $${parseInt(quotedAmount).toLocaleString()}`;
    try {
      await sendWelcomeQuote({
        to: email,
        name,
        setPasswordUrl: res.data.setPasswordUrl,
        quoteSummary: summary,
        portalUrl: CUSTOMER_PORTAL_URL,
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
    }
    setBusy(false);
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-rpm-silver">Source:</span>
          {(['phone', 'walkin', 'referral', 'in_person'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={
                'px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ' +
                (source === s ? 'bg-rpm-red/15 border-rpm-red text-rpm-red' : 'border-rpm-gray text-rpm-silver hover:text-rpm-white')
              }
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Vehicle</h2>
          <div className="flex items-center gap-1">
            <input value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="VIN (optional, auto-fills)" className="px-2 py-1 rounded-md bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white font-mono w-56" />
            <button type="button" onClick={decodeVin} disabled={vinDecoding || vin.trim().length < 11} className="px-2 py-1 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white disabled:opacity-50">
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
            {SIZE_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
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
