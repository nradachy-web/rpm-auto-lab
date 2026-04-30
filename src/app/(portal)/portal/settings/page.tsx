'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Settings {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  smsConsent: boolean;
  pushConsent: boolean;
  referralCode?: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [pushConsent, setPushConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ user: Settings }>('/api/portal/settings');
    if (res.ok && res.data?.user) {
      const u = res.data.user;
      setSettings(u);
      setName(u.name);
      setPhone(u.phone || '');
      setSmsConsent(u.smsConsent);
      setPushConsent(u.pushConsent);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    const res = await api.patch('/api/portal/settings', {
      name,
      phone: phone || null,
      smsConsent,
      pushConsent,
    });
    setBusy(false);
    if (res.ok) {
      setSavedAt(new Date());
      load();
    } else {
      alert(res.error || 'Save failed');
    }
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (!settings) return <div className="text-rpm-red text-sm">Not signed in.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Settings</h1>
        <p className="text-rpm-silver mt-1">Your account, contact details, and notification preferences.</p>
      </header>

      <section className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-6 space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Profile</h2>
        <label className="block text-xs text-rpm-silver">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </label>
        <label className="block text-xs text-rpm-silver">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(248) 555-0199" className="mt-1 w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white" />
        </label>
        <div className="flex justify-between items-center text-xs">
          <span className="text-rpm-silver">Email · {settings.email}</span>
          {settings.referralCode && (
            <span className="text-rpm-silver">Your referral code: <span className="text-rpm-red font-bold">{settings.referralCode}</span></span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-6 space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-rpm-silver">Notifications</h2>
        <Toggle
          checked={smsConsent}
          onChange={setSmsConsent}
          label="Text message updates"
          hint="Job status changes, scheduling reminders, and pickup notifications. Standard rates apply."
        />
        <Toggle
          checked={pushConsent}
          onChange={setPushConsent}
          label="Push notifications"
          hint="Browser notifications for status changes and shop messages."
        />
      </section>

      <div className="flex items-center justify-between">
        <span className="text-xs text-rpm-silver">{savedAt && `Saved ${savedAt.toLocaleTimeString()}`}</span>
        <button onClick={save} disabled={busy} className="px-4 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          'relative inline-flex h-6 w-11 shrink-0 mt-0.5 rounded-full transition-colors ' +
          (checked ? 'bg-rpm-red' : 'bg-rpm-gray')
        }
      >
        <span className={'inline-block h-5 w-5 rounded-full bg-white shadow transform transition ' + (checked ? 'translate-x-5' : 'translate-x-0.5') + ' mt-0.5'} />
      </button>
      <div>
        <div className="text-sm text-rpm-white font-semibold">{label}</div>
        {hint && <div className="text-xs text-rpm-silver mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}
