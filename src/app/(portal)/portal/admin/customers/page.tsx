'use client';

import { useEffect, useState } from 'react';
import { Search, StickyNote } from 'lucide-react';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  createdAt: string;
  _count: { vehicles: number; quotes: number; jobs: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const load = async () => {
    const res = await api.get<{ customers: Customer[] }>('/api/admin/overview');
    if (res.ok) setCustomers(res.data?.customers ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? customers
    : customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.phone || '').toLowerCase().includes(term) ||
          (c.notes || '').toLowerCase().includes(term)
      );

  const startEdit = (c: Customer) => {
    setEditingNotesFor(c.id);
    setNoteDraft(c.notes || '');
  };

  const saveNotes = async (id: string) => {
    setSavingNotes(true);
    await api.patch(`/api/admin/customers/${id}`, { notes: noteDraft || null });
    setSavingNotes(false);
    setEditingNotesFor(null);
    load();
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Customers</h1>
        <p className="text-rpm-silver mt-1">{customers.length} on file. Click the note icon to add a private memo.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name, email, phone, or note"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          {term ? 'No matches.' : 'No customers yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-base font-bold text-rpm-white">{c.name}</div>
                  <div className="text-xs text-rpm-silver mt-0.5">
                    {c.email} {c.phone && `· ${c.phone}`}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-rpm-silver/70 mt-1">
                    {c._count.vehicles} vehicle{c._count.vehicles === 1 ? '' : 's'} · {c._count.jobs} job{c._count.jobs === 1 ? '' : 's'} · {c._count.quotes} quote{c._count.quotes === 1 ? '' : 's'} · joined {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(c)}
                  className="px-2.5 py-1.5 rounded-md border border-rpm-gray text-xs text-rpm-silver hover:text-rpm-white flex items-center gap-1"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  {c.notes ? 'Edit note' : 'Add note'}
                </button>
              </div>
              {editingNotesFor === c.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Private notes — only admins see this. e.g. picky about edge tucks, always pays cash, referred by Dan."
                    className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNotesFor(null)} className="px-3 py-1.5 text-xs text-rpm-silver hover:text-rpm-white">Cancel</button>
                    <button onClick={() => saveNotes(c.id)} disabled={savingNotes} className="px-3 py-1.5 rounded-md bg-rpm-red text-white text-xs font-bold disabled:opacity-50">
                      {savingNotes ? 'Saving…' : 'Save note'}
                    </button>
                  </div>
                </div>
              ) : c.notes && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 italic">
                  {c.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
