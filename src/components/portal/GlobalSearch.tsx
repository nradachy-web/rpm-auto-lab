'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResults {
  customers: { id: string; name: string; email: string; phone?: string | null }[];
  vehicles: { id: string; year: number; make: string; model: string; user?: { id: string; name: string } | null }[];
  jobs: { id: string; services: string[]; status: string; user: { id: string; name: string }; vehicle: { year: number; make: string; model: string } }[];
  quotes: { id: string; services: string[]; status: string; user: { id: string; name: string }; vehicle: { year: number; make: string; model: string } }[];
  invoices: { id: string; number: string; status: string; totalCents: number; user: { id: string; name: string } }[];
}

const empty: SearchResults = { customers: [], vehicles: [], jobs: [], quotes: [], invoices: [] };

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>(empty);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults(empty);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const res = await api.get<SearchResults>(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
      setLoading(false);
      if (res.ok && res.data) setResults(res.data);
    }, 250);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const input = containerRef.current?.querySelector('input');
        input?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const totalResults =
    results.customers.length + results.vehicles.length + results.jobs.length + results.quotes.length + results.invoices.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers, vehicles, jobs, invoices… ( / )"
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/60 focus:outline-none focus:border-rpm-red"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full max-h-[70vh] overflow-y-auto rounded-xl border border-rpm-gray/60 bg-rpm-dark shadow-2xl">
          {loading && <div className="p-3 text-xs text-rpm-silver">Searching…</div>}
          {!loading && totalResults === 0 && <div className="p-3 text-xs text-rpm-silver">No results.</div>}
          {results.customers.length > 0 && (
            <Section title="Customers">
              {results.customers.map((c) => (
                <Row key={c.id} title={c.name} subtitle={`${c.email}${c.phone ? ' · ' + c.phone : ''}`} href={`/portal/admin?tab=customers`} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {results.vehicles.length > 0 && (
            <Section title="Vehicles">
              {results.vehicles.map((v) => (
                <Row key={v.id} title={`${v.year} ${v.make} ${v.model}`} subtitle={v.user?.name ?? ''} href={`/portal/admin`} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {results.jobs.length > 0 && (
            <Section title="Jobs">
              {results.jobs.map((j) => (
                <Row key={j.id} title={`${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}`} subtitle={`${j.user.name} · ${j.services.join(', ')} · ${j.status}`} href="/portal/admin" onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {results.quotes.length > 0 && (
            <Section title="Quotes">
              {results.quotes.map((q) => (
                <Row key={q.id} title={`${q.vehicle.year} ${q.vehicle.make} ${q.vehicle.model}`} subtitle={`${q.user.name} · ${q.services.join(', ')} · ${q.status}`} href="/portal/admin" onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {results.invoices.length > 0 && (
            <Section title="Invoices">
              {results.invoices.map((inv) => (
                <Row key={inv.id} title={inv.number} subtitle={`${inv.user.name} · $${(inv.totalCents/100).toFixed(2)} · ${inv.status}`} href={`/portal/admin/invoices?open=${inv.id}`} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-bold text-rpm-silver/60">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ title, subtitle, href, onClick }: { title: string; subtitle: string; href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 hover:bg-rpm-charcoal/60 border-b border-rpm-gray/20 last:border-0"
    >
      <div className="text-sm text-rpm-white font-medium truncate">{title}</div>
      <div className="text-xs text-rpm-silver truncate">{subtitle}</div>
    </Link>
  );
}
