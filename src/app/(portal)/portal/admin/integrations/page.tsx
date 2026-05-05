'use client';

import { useEffect, useState } from 'react';
import { Plug, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UrableStatus {
  configured: boolean;
  lastRun: { startedAt: string; finishedAt?: string | null; customersUpserted: number; itemsUpserted: number; errorText?: string | null } | null;
  linkedCustomers: number;
  linkedVehicles: number;
}

interface GoogleStatus {
  connected: boolean;
  googleEmail?: string;
  calendarId?: string;
  gbpLocationId?: string | null;
  sendAsEmail?: string | null;
  scopes?: string;
}

const fmtAgo = (iso?: string | null) => {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3600_000) return `${Math.round(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3600_000)} h ago`;
  return new Date(iso).toLocaleString();
};

export default function IntegrationsPage() {
  const [urable, setUrable] = useState<UrableStatus | null>(null);
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const [u, g] = await Promise.all([
      api.get<UrableStatus>('/api/admin/integrations/urable'),
      api.get<GoogleStatus>('/api/admin/integrations/google'),
    ]);
    if (u.ok) setUrable(u.data);
    if (g.ok) setGoogle(g.data);
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const res = await api.post<{ ok: boolean; customersUpserted: number; itemsUpserted: number }>('/api/admin/integrations/urable/sync');
    setSyncing(false);
    if (!res.ok) {
      alert(res.error || 'Sync failed');
      return;
    }
    alert(`Synced ${res.data?.customersUpserted ?? 0} customers and ${res.data?.itemsUpserted ?? 0} vehicles from Urable.`);
    load();
  };

  const startGoogle = async () => {
    const res = await api.get<{ url: string }>('/api/google/oauth/start');
    if (!res.ok || !res.data?.url) {
      alert(res.error || 'Could not start Google sign-in');
      return;
    }
    window.location.href = res.data.url;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <Plug className="w-6 h-6 text-rpm-red" />
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Integrations</h1>
          <p className="text-rpm-silver mt-1 text-sm">External systems we pull from and push to.</p>
        </div>
      </header>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-rpm-white">Urable</h2>
            <p className="text-xs text-rpm-silver mt-0.5">Pulls customers + vehicles from your Urable account every 6 hours. Their public API doesn&apos;t expose jobs/invoices/schedule yet.</p>
          </div>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border',
            urable?.configured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'bg-rpm-red/10 text-rpm-red border-rpm-red/40'
          )}>{urable?.configured ? 'Connected' : 'Not configured'}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Linked customers" value={urable?.linkedCustomers ?? 0} />
          <Stat label="Linked vehicles" value={urable?.linkedVehicles ?? 0} />
          <Stat label="Last sync" value={fmtAgo(urable?.lastRun?.finishedAt ?? urable?.lastRun?.startedAt)} />
          <Stat label="Last batch" value={urable?.lastRun ? `+${urable.lastRun.customersUpserted}c · +${urable.lastRun.itemsUpserted}v` : '—'} />
        </div>
        {urable?.lastRun?.errorText && (
          <div className="rounded-lg border border-rpm-red/40 bg-rpm-red/5 px-3 py-2 text-xs text-rpm-red">
            Last sync error: {urable.lastRun.errorText}
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={sync} disabled={syncing || !urable?.configured} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-rpm-white">Google</h2>
            <p className="text-xs text-rpm-silver mt-0.5">Calendar two-way sync, Business Profile reviews, Gmail send-as.</p>
          </div>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border',
            google?.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'bg-rpm-gray/30 text-rpm-silver border-rpm-gray/40'
          )}>{google?.connected ? 'Connected' : 'Not connected'}</span>
        </div>
        {google?.connected ? (
          <div className="space-y-2 text-sm">
            <Row k="Account" v={google.googleEmail || ''} />
            <Row k="Calendar" v={google.calendarId || 'primary'} />
            <Row k="GBP location" v={google.gbpLocationId || '—'} />
          </div>
        ) : (
          <div className="text-xs text-rpm-silver">Connect Alex&apos;s Google account once. We use the refresh token to push job events into his calendar and import Google reviews.</div>
        )}
        <div className="flex justify-end">
          <button onClick={startGoogle} className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm font-bold text-rpm-white hover:border-rpm-red hover:text-rpm-red flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            {google?.connected ? 'Reconnect' : 'Connect Google'}
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-rpm-silver">{label}</div>
      <div className="text-lg font-bold text-rpm-white tabular-nums">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-rpm-silver">{k}</span>
      <span className="text-rpm-white truncate">{v}</span>
    </div>
  );
}
