'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Mail, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import CustomerDetail from '@/components/portal/CustomerDetail';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  createdAt: string;
  _count: { vehicles: number; quotes: number; jobs: number };
}

type SortKey = 'recent' | 'name' | 'jobs';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const res = await api.get<{ customers: Customer[] }>('/api/admin/overview');
    if (res.ok) setCustomers(res.data?.customers ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = !term
      ? customers
      : customers.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            (c.phone || '').toLowerCase().includes(term) ||
            (c.notes || '').toLowerCase().includes(term)
        );
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'jobs') return b._count.jobs - a._count.jobs;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [customers, term, sort]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Customers</h1>
          <p className="text-rpm-silver mt-1">{customers.length} on file. Click any row for full history.</p>
        </div>
        <Link href="/portal/admin/new-quote" className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark">
          + New customer
        </Link>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, email, phone, or note"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
        </div>
        <div className="flex items-center gap-1 bg-rpm-charcoal rounded-lg p-1 border border-rpm-gray/40">
          {(['recent', 'name', 'jobs'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1.5 rounded-md text-xs font-bold', sort === s ? 'bg-rpm-red text-white' : 'text-rpm-silver hover:text-rpm-white')}>
              {s === 'recent' ? 'Recent' : s === 'name' ? 'Name' : 'Most jobs'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          {term ? 'No matches.' : 'No customers yet — click "+ New customer" to add one.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 flex items-start justify-between gap-3 hover:border-rpm-red/40 transition">
              <button onClick={() => setOpenId(c.id)} className="flex-1 min-w-0 text-left">
                <div className="text-base font-bold text-rpm-white">{c.name}</div>
                <div className="text-xs text-rpm-silver mt-0.5 truncate">
                  {c.email} {c.phone && `· ${c.phone}`}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-rpm-silver/70 mt-1">
                  {c._count.vehicles} vehicle{c._count.vehicles === 1 ? '' : 's'} · {c._count.jobs} job{c._count.jobs === 1 ? '' : 's'} · {c._count.quotes} quote{c._count.quotes === 1 ? '' : 's'} · joined {new Date(c.createdAt).toLocaleDateString()}
                </div>
                {c.notes && (
                  <div className="mt-2 text-xs text-amber-200/80 italic line-clamp-2">{c.notes}</div>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <a href={`mailto:${c.email}`} className="p-2 rounded-md border border-rpm-gray/50 text-rpm-silver hover:text-rpm-white hover:border-rpm-red/40" title="Email">
                  <Mail className="w-4 h-4" />
                </a>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="p-2 rounded-md border border-rpm-gray/50 text-rpm-silver hover:text-rpm-white hover:border-rpm-red/40" title="Call">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <Link href={`/portal/admin/messages?customer=${c.id}`} className="p-2 rounded-md border border-rpm-gray/50 text-rpm-silver hover:text-rpm-white hover:border-rpm-red/40" title="Message">
                  <MessageSquare className="w-4 h-4" />
                </Link>
                <button onClick={() => setOpenId(c.id)} className="hidden md:inline-block px-3 py-2 text-xs font-bold text-rpm-red hover:text-rpm-red-glow">
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openId && (
        <CustomerDetail
          id={openId}
          onClose={() => { setOpenId(null); load(); }}
          onDeleted={() => load()}
        />
      )}
    </div>
  );
}
