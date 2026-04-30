'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'sent' | 'cancelled';
  sentAt?: string | null;
  createdAt: string;
  _count: { recipients: number };
}

const WEB3_URL = 'https://api.web3forms.com/submit';
const WEB3_KEY = '303522ac-eb15-45ea-9ba6-a6c1796aad8b';

async function sendEmailDirect(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(WEB3_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3_KEY,
        subject,
        from_name: 'RPM Auto Lab',
        email: to,
        message: body,
      }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network' };
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<{ campaigns: Campaign[] }>('/api/admin/campaigns');
    if (res.ok) setCampaigns(res.data?.campaigns ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Campaigns</h1>
          <p className="text-rpm-silver mt-1">Compose marketing emails. Sends fire from your browser via Web3Forms.</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          New campaign
        </button>
      </header>

      {composeOpen && <Compose onClose={() => { setComposeOpen(false); load(); }} />}

      <div className="space-y-3">
        {campaigns.length === 0 && !composeOpen && (
          <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
            No campaigns yet.
          </div>
        )}
        {campaigns.map((c) => (
          <CampaignRow key={c.id} campaign={c} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function CampaignRow({ campaign, onChange }: { campaign: Campaign; onChange: () => void }) {
  const [progress, setProgress] = useState<{ sent: number; failed: number; running: boolean }>({ sent: 0, failed: 0, running: false });

  const sendBatch = async () => {
    setProgress((p) => ({ ...p, running: true }));
    let sent = 0, failed = 0;
    let total = 0;
    while (true) {
      const res = await api.get<{
        recipients: { id: string; user: { email: string; name: string } | null }[];
        campaign: { subject: string; body: string } | null;
      }>(`/api/admin/campaigns/${campaign.id}/next?limit=10`);
      if (!res.ok || !res.data) break;
      if (res.data.recipients.length === 0) break;
      const subject = res.data.campaign?.subject || campaign.subject;
      const body = res.data.campaign?.body || campaign.body;
      total += res.data.recipients.length;
      for (const r of res.data.recipients) {
        if (!r.user?.email) {
          await api.patch(`/api/admin/campaigns/${campaign.id}/recipients/${r.id}`, { status: 'failed', error: 'No email' });
          failed++;
          continue;
        }
        const out = await sendEmailDirect(r.user.email, subject, body.replace(/\{name\}/g, r.user.name));
        if (out.ok) {
          await api.patch(`/api/admin/campaigns/${campaign.id}/recipients/${r.id}`, { status: 'sent' });
          sent++;
        } else {
          await api.patch(`/api/admin/campaigns/${campaign.id}/recipients/${r.id}`, { status: 'failed', error: out.error });
          failed++;
        }
        setProgress({ sent, failed, running: true });
        // small delay to avoid hammering Web3Forms
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    setProgress({ sent, failed, running: false });
    onChange();
    if (total > 0) alert(`Sent ${sent} / ${total} (${failed} failed)`);
  };

  return (
    <div className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-base font-bold text-rpm-white">{campaign.name}</div>
          <div className="text-xs text-rpm-silver">{campaign.subject}</div>
          <div className="text-[11px] uppercase tracking-wider text-rpm-silver mt-1">
            {campaign._count.recipients} recipients · {campaign.status}
            {progress.running && ` · sending… (${progress.sent} sent, ${progress.failed} failed)`}
          </div>
        </div>
        {campaign.status !== 'sent' && (
          <button onClick={sendBatch} disabled={progress.running} className={cn('px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 disabled:opacity-50', 'bg-rpm-red text-white')}>
            <Send className="w-3.5 h-3.5" />
            {progress.running ? 'Sending…' : 'Send all'}
          </button>
        )}
      </div>
    </div>
  );
}

function Compose({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [hasService, setHasService] = useState('');
  const [noVisit, setNoVisit] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name || !subject || !body) return;
    setBusy(true);
    const res = await api.post('/api/admin/campaigns', {
      name,
      subject,
      body,
      segment: {
        hasService: hasService || undefined,
        noVisitForDays: noVisit ? parseInt(noVisit) : undefined,
        minLifetimeCents: minSpend ? Math.round(parseFloat(minSpend) * 100) : undefined,
      },
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.error || 'Failed');
      return;
    }
    onClose();
  };

  return (
    <div className="rounded-xl border border-rpm-red/40 bg-rpm-dark p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal name" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      </div>
      <textarea
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (use {name} to personalize)"
        className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={hasService} onChange={(e) => setHasService(e.target.value)} placeholder="Service slug filter" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input type="number" value={noVisit} onChange={(e) => setNoVisit(e.target.value)} placeholder="No visit for N days" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        <input type="number" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} placeholder="Min lifetime $" className="px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-rpm-silver hover:text-rpm-white">Cancel</button>
        <button onClick={create} disabled={busy || !name || !subject || !body} className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold disabled:opacity-50">
          {busy ? 'Saving…' : 'Save campaign'}
        </button>
      </div>
    </div>
  );
}
