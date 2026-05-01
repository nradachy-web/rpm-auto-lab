'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  _count: { vehicles: number; quotes: number; jobs: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api.get<{ customers: Customer[] }>('/api/admin/overview');
      if (res.ok) setCustomers(res.data?.customers ?? []);
      setLoading(false);
    })();
  }, []);

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? customers
    : customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.phone || '').toLowerCase().includes(term)
      );

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Customers</h1>
        <p className="text-rpm-silver mt-1">{customers.length} on file. Use search above for cross-system lookup.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name, email, or phone"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          {term ? 'No matches.' : 'No customers yet.'}
        </div>
      ) : (
        <div className="rounded-xl border border-rpm-gray/40 bg-rpm-dark overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rpm-charcoal/60 text-xs uppercase tracking-wider text-rpm-silver">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3 hidden md:table-cell">Phone</th>
                <th className="text-right p-3">Vehicles</th>
                <th className="text-right p-3">Quotes</th>
                <th className="text-right p-3">Jobs</th>
                <th className="text-right p-3 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-rpm-gray/30 hover:bg-rpm-charcoal/30">
                  <td className="p-3 text-rpm-white font-semibold">{c.name}</td>
                  <td className="p-3 text-rpm-silver">{c.email}</td>
                  <td className="p-3 text-rpm-silver hidden md:table-cell">{c.phone || '—'}</td>
                  <td className="p-3 text-right tabular-nums text-rpm-silver">{c._count.vehicles}</td>
                  <td className="p-3 text-right tabular-nums text-rpm-silver">{c._count.quotes}</td>
                  <td className="p-3 text-right tabular-nums text-rpm-silver">{c._count.jobs}</td>
                  <td className="p-3 text-right text-rpm-silver/80 text-xs hidden md:table-cell">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
