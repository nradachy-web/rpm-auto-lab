'use client';

import { cn } from '@/lib/utils';

// Industry-standard PPF/coating coverage map. Each zone is a body panel that
// PPF/coating shops typically quote on. The coverage state per zone is one of:
//   "" / undefined  → not covered
//   "ppf"           → paint protection film
//   "coating"       → ceramic coating
//   "both"          → both stacked (PPF under coating)
// Caller provides the value map; we only render + emit changes.

export type Coverage = '' | 'ppf' | 'coating' | 'both';
export type DiagramValue = Record<string, Coverage>;

const ZONES: Array<{ id: string; label: string }> = [
  { id: 'front-bumper', label: 'Front Bumper' },
  { id: 'hood', label: 'Hood' },
  { id: 'fenders', label: 'Fenders' },
  { id: 'a-pillars', label: 'A-Pillars' },
  { id: 'mirrors', label: 'Mirrors' },
  { id: 'doors', label: 'Doors' },
  { id: 'rocker-panels', label: 'Rocker Panels' },
  { id: 'rear-bumper', label: 'Rear Bumper' },
  { id: 'trunk', label: 'Trunk / Tailgate' },
  { id: 'roof', label: 'Roof' },
  { id: 'door-handles', label: 'Door Handles' },
  { id: 'door-cups', label: 'Door Cups' },
  { id: 'rear-arch', label: 'Rear Arches' },
  { id: 'headlights', label: 'Headlights' },
  { id: 'taillights', label: 'Taillights' },
];

const COVERAGE_LABEL: Record<Coverage, string> = {
  '': 'None',
  ppf: 'PPF',
  coating: 'Ceramic',
  both: 'PPF + Ceramic',
};

const COVERAGE_COLOR: Record<Coverage, string> = {
  '': 'bg-rpm-charcoal border-rpm-gray text-rpm-silver',
  ppf: 'bg-rpm-red/15 border-rpm-red/40 text-rpm-red',
  coating: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  both: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
};

const NEXT: Record<Coverage, Coverage> = {
  '': 'ppf',
  ppf: 'coating',
  coating: 'both',
  both: '',
};

export default function PartsDiagram({
  value,
  onChange,
  readOnly = false,
}: {
  value: DiagramValue;
  onChange?: (next: DiagramValue) => void;
  readOnly?: boolean;
}) {
  const setZone = (id: string) => {
    if (readOnly || !onChange) return;
    const cur = (value[id] || '') as Coverage;
    const next: DiagramValue = { ...value, [id]: NEXT[cur] };
    if (!next[id]) delete next[id];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {ZONES.map((z) => {
          const cov = (value[z.id] || '') as Coverage;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setZone(z.id)}
              disabled={readOnly}
              className={cn(
                'rounded-lg border p-3 text-left transition disabled:cursor-default',
                COVERAGE_COLOR[cov],
                !readOnly && 'hover:scale-[1.02]'
              )}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-80">{z.label}</div>
              <div className="text-sm font-bold mt-0.5">{COVERAGE_LABEL[cov]}</div>
            </button>
          );
        })}
      </div>
      {!readOnly && (
        <p className="text-[11px] text-rpm-silver/60">
          Tap a panel to cycle: None → PPF → Ceramic → PPF + Ceramic → None.
        </p>
      )}
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
      {(['ppf', 'coating', 'both'] as Coverage[]).map((c) => (
        <span key={c} className={cn('px-2 py-0.5 rounded-full border font-bold', COVERAGE_COLOR[c])}>
          {COVERAGE_LABEL[c]}
        </span>
      ))}
    </div>
  );
}
