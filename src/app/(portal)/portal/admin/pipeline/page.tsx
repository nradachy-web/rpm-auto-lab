'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type QuoteStatus = 'submitted' | 'quoted' | 'approved' | 'converted' | 'declined';

interface Quote {
  id: string;
  services: string[];
  status: QuoteStatus;
  estimatedTotal: number;
  quotedAmount?: number | null;
  submittedAt: string;
  respondedAt?: string | null;
  acceptedAt?: string | null;
  publicToken?: string | null;
  source?: string | null;
  notes?: string | null;
  user: { id: string; name: string; email: string; phone?: string | null };
  vehicle: { id: string; year: number; make: string; model: string; trim?: string | null };
  options: { id: string; name: string; priceCents: number; recommended: boolean }[];
  jobs: { id: string; status: string }[];
}

const COLUMNS: { key: QuoteStatus; label: string; tone: string; help: string }[] = [
  { key: 'submitted', label: 'New / Inbound', tone: 'border-amber-500/40 text-amber-400', help: 'Customer submitted, no price yet' },
  { key: 'quoted',    label: 'Quoted',         tone: 'border-m-blue/40 text-m-blue',       help: 'Price sent, waiting on customer' },
  { key: 'approved',  label: 'Approved',       tone: 'border-emerald-500/40 text-emerald-400', help: 'Ready to schedule' },
  { key: 'converted', label: 'Scheduled',      tone: 'border-rpm-gray/40 text-rpm-silver',  help: 'Has a job — see Schedule' },
  { key: 'declined',  label: 'Lost',           tone: 'border-rpm-red/40 text-rpm-red',      help: 'Declined or stale' },
];

const $ = (n: number) => `$${n.toLocaleString()}`;
const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));

export default function PipelinePage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ quotes: Quote[] }>('/api/admin/pipeline');
    if (res.ok) setQuotes(res.data?.quotes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const term = filter.trim().toLowerCase();
  const filtered = useMemo(
    () => term
      ? quotes.filter((q) =>
          q.user.name.toLowerCase().includes(term) ||
          q.vehicle.make.toLowerCase().includes(term) ||
          q.vehicle.model.toLowerCase().includes(term) ||
          q.services.join(' ').toLowerCase().includes(term)
        )
      : quotes,
    [quotes, term]
  );

  const byCol = useMemo(() => {
    const map = new Map<QuoteStatus, Quote[]>();
    for (const c of COLUMNS) map.set(c.key, []);
    for (const q of filtered) (map.get(q.status) ?? []).push(q);
    return map;
  }, [filtered]);

  const moveTo = async (quoteId: string, status: QuoteStatus) => {
    const res = await api.patch(`/api/admin/quotes/${quoteId}`, { status });
    if (!res.ok) {
      alert(res.error || 'Move failed');
      return;
    }
    load();
  };

  const totals = useMemo(() => {
    const t = new Map<QuoteStatus, { count: number; value: number }>();
    for (const c of COLUMNS) t.set(c.key, { count: 0, value: 0 });
    for (const q of filtered) {
      const cur = t.get(q.status)!;
      cur.count++;
      cur.value += q.quotedAmount ?? q.estimatedTotal;
    }
    return t;
  }, [filtered]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Pipeline</h1>
          <p className="text-rpm-silver mt-1 text-sm">Drag quotes between stages. Stale quotes get a red age tag.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, vehicle, service"
            className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white w-64"
          />
          <Link href="/portal/admin/new-quote" className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New quote
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const items = byCol.get(col.key) ?? [];
          const t = totals.get(col.key)!;
          return (
            <Column
              key={col.key}
              col={col}
              count={t.count}
              value={t.value}
              items={items}
              copied={copied}
              setCopied={setCopied}
              onDrop={(qid) => moveTo(qid, col.key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Column({
  col, count, value, items, copied, setCopied, onDrop,
}: {
  col: typeof COLUMNS[number];
  count: number;
  value: number;
  items: Quote[];
  copied: string | null;
  setCopied: (s: string | null) => void;
  onDrop: (qid: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop(id);
      }}
      className={cn(
        'rounded-xl border bg-rpm-dark p-2 min-h-[300px] flex flex-col',
        col.tone.split(' ')[0],
        over && 'bg-rpm-red/[0.05] border-rpm-red'
      )}
    >
      <header className="px-2 py-2 flex items-center justify-between">
        <div>
          <div className={cn('text-[11px] uppercase tracking-wider font-bold', col.tone.split(' ')[1])}>{col.label}</div>
          <div className="text-[10px] text-rpm-silver/70">{col.help}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-rpm-white tabular-nums">{count}</div>
          {value > 0 && <div className="text-[10px] text-rpm-silver tabular-nums">{$(value)}</div>}
        </div>
      </header>
      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-2 py-3 text-[11px] text-rpm-silver/50 italic">Drop quotes here.</div>
        ) : items.map((q) => (
          <QuoteCard key={q.id} quote={q} copied={copied} setCopied={setCopied} />
        ))}
      </div>
    </div>
  );
}

function QuoteCard({
  quote, copied, setCopied,
}: {
  quote: Quote;
  copied: string | null;
  setCopied: (s: string | null) => void;
}) {
  const age = ageDays(quote.respondedAt || quote.submittedAt);
  const stale = quote.status === 'quoted' && age > 7;
  const acceptUrl = quote.publicToken
    ? `https://nradachy-web.github.io/rpm-auto-lab/portal/quote-accept?token=${encodeURIComponent(quote.publicToken)}`
    : null;
  const price = quote.quotedAmount ?? quote.estimatedTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={(e) => (e as unknown as React.DragEvent).dataTransfer.setData('text/plain', quote.id)}
      className="rounded-lg bg-rpm-charcoal/70 border border-rpm-gray/40 p-2.5 cursor-move hover:border-rpm-red/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-rpm-white truncate">{quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}</div>
          <div className="text-[11px] text-rpm-silver truncate">{quote.user.name}</div>
        </div>
        <div className="text-sm font-bold text-rpm-white tabular-nums shrink-0">{$(price)}</div>
      </div>
      <div className="text-[10px] text-rpm-silver/80 truncate mt-1">{quote.services.join(', ')}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {quote.options.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rpm-gray/30 text-[9px] text-rpm-silver uppercase">{quote.options.length} opts</span>
          )}
          {quote.source && (
            <span className="px-1.5 py-0.5 rounded-full bg-rpm-gray/30 text-[9px] text-rpm-silver uppercase">{quote.source}</span>
          )}
          <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] uppercase font-bold',
            stale ? 'bg-rpm-red/20 text-rpm-red' : 'bg-rpm-gray/30 text-rpm-silver'
          )}>{age}d</span>
        </div>
        {acceptUrl && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(acceptUrl);
              setCopied(quote.id);
              setTimeout(() => setCopied(null), 1200);
            }}
            title="Copy customer accept link"
            className="p-1 rounded text-rpm-silver hover:text-rpm-white"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
      {copied === quote.id && <div className="text-[10px] text-emerald-400 mt-1">Link copied</div>}
    </motion.div>
  );
}
