'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Bay { id: string; name: string; description?: string | null; active: boolean; sortOrder: number }
interface Technician { id: string; name: string; initials?: string | null; active: boolean; userId?: string | null }

export default function TeamPage() {
  const [bays, setBays] = useState<Bay[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, tRes] = await Promise.all([
      api.get<{ bays: Bay[] }>('/api/admin/bays'),
      api.get<{ technicians: Technician[] }>('/api/admin/technicians'),
    ]);
    if (!bRes.ok || !tRes.ok) setErr(bRes.error || tRes.error || 'Failed to load');
    else {
      setBays(bRes.data?.bays ?? []);
      setTechs(tRes.data?.technicians ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (err) return <div className="text-rpm-red text-sm">{err}</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Team & Bays</h1>
        <p className="text-rpm-silver mt-1">Manage shop bays and technicians used for scheduling.</p>
      </header>

      <BayList bays={bays} onChange={load} />
      <TechList techs={techs} onChange={load} />
    </div>
  );
}

function BayList({ bays, onChange }: { bays: Bay[]; onChange: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await api.post('/api/admin/bays', { name: name.trim() });
    setBusy(false);
    setName('');
    onChange();
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-rpm-white mb-3">Bays</h2>
      <div className="space-y-2">
        {bays.map((b) => (
          <BayRow key={b.id} bay={b} onChange={onChange} />
        ))}
        <div className="flex gap-2 mt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New bay name (e.g. Detail Bay)"
            className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <button onClick={add} disabled={busy || !name.trim()} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50">
            Add bay
          </button>
        </div>
      </div>
    </section>
  );
}

function BayRow({ bay, onChange }: { bay: Bay; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bay.name);
  const [active, setActive] = useState(bay.active);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await api.patch(`/api/admin/bays/${bay.id}`, { name, active });
    setBusy(false);
    setEditing(false);
    onChange();
  };

  return (
    <div className={cn('rounded-lg border p-3 flex items-center justify-between gap-3', bay.active ? 'border-rpm-gray/50 bg-rpm-dark' : 'border-rpm-gray/30 bg-rpm-dark/50 opacity-60')}>
      {!editing ? (
        <>
          <div>
            <div className="text-sm font-semibold text-rpm-white">{bay.name}</div>
            {!bay.active && <div className="text-[10px] uppercase tracking-wider text-rpm-silver/70">Inactive</div>}
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-rpm-silver hover:text-rpm-white">Edit</button>
        </>
      ) : (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-2 py-1.5 rounded-md bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <label className="text-xs text-rpm-silver flex items-center gap-1">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <button onClick={save} disabled={busy} className="px-2 py-1 rounded-md bg-rpm-red text-white text-xs font-bold disabled:opacity-50">Save</button>
        </>
      )}
    </div>
  );
}

function TechList({ techs, onChange }: { techs: Technician[]; onChange: () => void }) {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await api.post('/api/admin/technicians', { name: name.trim(), initials: initials.trim() || undefined });
    setBusy(false);
    setName('');
    setInitials('');
    onChange();
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-rpm-white mb-3">Technicians</h2>
      <div className="space-y-2">
        {techs.map((t) => (
          <TechRow key={t.id} tech={t} onChange={onChange} />
        ))}
        <div className="flex gap-2 mt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tech name (e.g. Alex M.)"
            className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <input
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            placeholder="AM"
            maxLength={4}
            className="w-20 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white"
          />
          <button onClick={add} disabled={busy || !name.trim()} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50">
            Add tech
          </button>
        </div>
      </div>
    </section>
  );
}

function TechRow({ tech, onChange }: { tech: Technician; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tech.name);
  const [initials, setInitials] = useState(tech.initials ?? '');
  const [active, setActive] = useState(tech.active);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await api.patch(`/api/admin/technicians/${tech.id}`, { name, initials: initials || null, active });
    setBusy(false);
    setEditing(false);
    onChange();
  };

  return (
    <div className={cn('rounded-lg border p-3 flex items-center justify-between gap-3', tech.active ? 'border-rpm-gray/50 bg-rpm-dark' : 'border-rpm-gray/30 bg-rpm-dark/50 opacity-60')}>
      {!editing ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rpm-red/15 border border-rpm-red/40 flex items-center justify-center text-xs font-bold text-rpm-red">
              {tech.initials || tech.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-rpm-white">{tech.name}</div>
              {!tech.active && <div className="text-[10px] uppercase tracking-wider text-rpm-silver/70">Inactive</div>}
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-rpm-silver hover:text-rpm-white">Edit</button>
        </>
      ) : (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-2 py-1.5 rounded-md bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase())} maxLength={4} className="w-16 px-2 py-1.5 rounded-md bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white text-center" />
          <label className="text-xs text-rpm-silver flex items-center gap-1">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <button onClick={save} disabled={busy} className="px-2 py-1 rounded-md bg-rpm-red text-white text-xs font-bold disabled:opacity-50">Save</button>
        </>
      )}
    </div>
  );
}
