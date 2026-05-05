'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Tx { id: string; delta: number; reason: string; createdAt: string; note?: string | null }
interface Item {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  lowStockAt?: number | null;
  transactions: Tx[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('roll');
  const [qty, setQty] = useState('0');
  const [low, setLow] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<{ items: Item[] }>('/api/admin/inventory');
    if (res.ok) setItems(res.data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    const res = await api.post('/api/admin/inventory', {
      name: name.trim(),
      unit: unit.trim() || 'unit',
      quantity: parseFloat(qty) || 0,
      lowStockAt: low ? parseFloat(low) : undefined,
    });
    if (!res.ok) {
      alert(res.error || 'Failed to add item');
      return;
    }
    setName(''); setQty('0'); setLow('');
    load();
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  const lowStock = items.filter((i) => i.lowStockAt != null && i.quantity <= (i.lowStockAt ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Inventory</h1>
        <p className="text-rpm-silver mt-1">Track materials. Low-stock items show up in admin notifications.</p>
      </header>

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-300">
          Low stock: {lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
        </div>
      )}

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item (e.g. PPF Roll)" className="md:col-span-2 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input type="number" value={low} onChange={(e) => setLow(e.target.value)} placeholder="Low at" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </div>
        <div className="flex justify-end mt-2">
          <button onClick={add} disabled={!name} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">Add item</button>
        </div>
      </section>

      <div className="space-y-3">
        {items.map((i) => (
          <ItemRow key={i.id} item={i} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function ItemRow({ item, onChange }: { item: Item; onChange: () => void }) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState<'restock' | 'job_use' | 'adjustment' | 'loss'>('restock');
  const [busy, setBusy] = useState(false);

  const isLow = item.lowStockAt != null && item.quantity <= item.lowStockAt;

  const apply = async (sign: 1 | -1) => {
    const v = parseFloat(delta);
    if (!Number.isFinite(v) || v <= 0) return;
    setBusy(true);
    const res = await api.patch(`/api/admin/inventory/${item.id}`, {
      delta: sign * v,
      reason,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Update failed');
      return;
    }
    setDelta('');
    onChange();
  };

  return (
    <div className={cn('rounded-xl border p-4', isLow ? 'border-amber-500/50 bg-amber-500/[0.04]' : 'border-rpm-gray/40 bg-rpm-dark')}>
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-rpm-white">{item.name}</div>
          <div className="text-xs text-rpm-silver">
            {item.quantity} {item.unit}{item.lowStockAt != null && ` · low at ${item.lowStockAt}`}
          </div>
        </div>
      </header>
      <div className="mt-3 flex items-center gap-2">
        <select value={reason} onChange={(e) => setReason(e.target.value as never)} className="px-2 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-xs text-rpm-white">
          <option value="restock">Restock</option>
          <option value="job_use">Job use</option>
          <option value="adjustment">Adjustment</option>
          <option value="loss">Loss</option>
        </select>
        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="Qty" className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <button onClick={() => apply(1)} disabled={busy || !delta} className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
        <button onClick={() => apply(-1)} disabled={busy || !delta} className="px-3 py-2 rounded-lg bg-rpm-red/15 border border-rpm-red/40 text-rpm-red text-sm font-bold disabled:opacity-50 flex items-center gap-1">
          <Minus className="w-3 h-3" /> Use
        </button>
      </div>
      {item.transactions.length > 0 && (
        <details className="mt-3 text-xs text-rpm-silver">
          <summary className="cursor-pointer hover:text-rpm-white">Recent activity</summary>
          <ul className="mt-2 space-y-1">
            {item.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span>{t.reason} · {new Date(t.createdAt).toLocaleString()}</span>
                <span className={t.delta > 0 ? 'text-emerald-300' : 'text-rpm-red'}>{t.delta > 0 ? '+' : ''}{t.delta}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
