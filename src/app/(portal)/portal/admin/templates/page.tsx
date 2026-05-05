'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface PackageRef { id: string; slug: string; name: string }
interface ServiceRow { package: PackageRef }
interface JobTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  totalPrice: number;
  durationMinutes: number;
  active: boolean;
  services: ServiceRow[];
}
interface ServicePackage { id: string; slug: string; name: string }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [tRes, cRes] = await Promise.all([
      api.get<{ templates: JobTemplate[] }>('/api/admin/templates'),
      api.get<{ categories: { packages: ServicePackage[] }[] }>('/api/admin/catalog'),
    ]);
    if (tRes.ok) setTemplates(tRes.data?.templates ?? []);
    if (cRes.ok) setPackages((cRes.data?.categories ?? []).flatMap((c) => c.packages));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Job Templates</h1>
          <p className="text-rpm-silver mt-1">Reusable bundles to speed up booking and quoting.</p>
        </div>
        <button onClick={() => setAdding(true)} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          New template
        </button>
      </header>

      {adding && <NewTemplate packages={packages} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}

      <div className="space-y-2">
        {templates.length === 0 && !adding && (
          <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
            No templates yet. Create one for your most common service combos.
          </div>
        )}
        {templates.map((t) => (
          <TemplateRow key={t.id} template={t} packages={packages} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function NewTemplate({ packages, onCancel, onSaved }: { packages: ServicePackage[]; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('120');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name || !slug) return;
    setBusy(true);
    const res = await api.post('/api/admin/templates', {
      slug,
      name,
      totalPrice: parseInt(price) || 0,
      durationMinutes: parseInt(duration) || 60,
      packageSlugs: Array.from(picked),
    });
    setBusy(false);
    if (!res.ok) { alert(res.error || 'Failed'); return; }
    onSaved();
  };

  return (
    <div className="rounded-xl border border-rpm-red/40 bg-rpm-dark p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} placeholder="Name (Front End PPF + Tint)" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white font-mono" />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Total price ($)" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (min)" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      </div>
      <div>
        <div className="text-xs text-rpm-silver mb-1">Includes:</div>
        <div className="flex flex-wrap gap-1.5">
          {packages.map((p) => (
            <button key={p.id} type="button" onClick={() => { const n = new Set(picked); if (n.has(p.slug)) n.delete(p.slug); else n.add(p.slug); setPicked(n); }} className={'px-2.5 py-1 rounded-full text-xs border ' + (picked.has(p.slug) ? 'bg-rpm-red/15 border-rpm-red text-rpm-red' : 'border-rpm-gray text-rpm-silver hover:text-rpm-white')}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
        <button onClick={create} disabled={busy || !name || !slug} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">{busy ? 'Saving…' : 'Save template'}</button>
      </div>
    </div>
  );
}

function TemplateRow({ template, packages, onChange }: { template: JobTemplate; packages: ServicePackage[]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [price, setPrice] = useState(String(template.totalPrice));
  const [duration, setDuration] = useState(String(template.durationMinutes));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(template.services.map((s) => s.package.slug)));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const res = await api.patch(`/api/admin/templates/${template.id}`, {
      name,
      totalPrice: parseInt(price) || 0,
      durationMinutes: parseInt(duration) || 60,
      packageSlugs: Array.from(picked),
    });
    setBusy(false);
    if (!res.ok) { alert(res.error || 'Save failed'); return; }
    setEditing(false);
    onChange();
  };

  const remove = async () => {
    if (!window.confirm('Archive this template?')) return;
    const res = await api.delete(`/api/admin/templates/${template.id}`);
    if (!res.ok) { alert(res.error || 'Delete failed'); return; }
    onChange();
  };

  return (
    <div className={'rounded-xl border p-4 ' + (template.active ? 'border-rpm-gray/50 bg-rpm-dark' : 'border-rpm-gray/30 bg-rpm-dark/50 opacity-60')}>
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-bold text-rpm-white">{template.name}</div>
            <div className="text-xs text-rpm-silver">{template.services.map((s) => s.package.name).join(' + ') || 'No services'}</div>
            <div className="text-[11px] uppercase tracking-wider text-rpm-silver mt-1">${template.totalPrice} · {template.durationMinutes}min</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-rpm-gray text-sm text-rpm-silver hover:text-rpm-white">Edit</button>
            <button onClick={remove} className="px-2 py-1.5 rounded-lg text-rpm-silver hover:text-rpm-red"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration min" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {packages.map((p) => (
              <button key={p.id} type="button" onClick={() => { const n = new Set(picked); if (n.has(p.slug)) n.delete(p.slug); else n.add(p.slug); setPicked(n); }} className={'px-2.5 py-1 rounded-full text-xs border ' + (picked.has(p.slug) ? 'bg-rpm-red/15 border-rpm-red text-rpm-red' : 'border-rpm-gray text-rpm-silver hover:text-rpm-white')}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-rpm-silver">Cancel</button>
            <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
