'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User { id: string; email: string; name: string; phone?: string | null; role: string }

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ user: User | null }>('/api/auth/me');
      if (cancelled) return;
      setUser(res.data?.user ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;
  if (!user) return <div className="text-rpm-red text-sm">Not signed in.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Settings</h1>
        <p className="text-rpm-silver mt-1">Your account details.</p>
      </header>

      <div className="rounded-xl border border-rpm-gray/50 bg-rpm-dark p-6 space-y-4">
        <Field label="Name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone || '—'} />
        <Field label="Role" value={user.role} />
      </div>

      <p className="text-xs text-rpm-silver/60">
        Need to change your name or phone? Message the shop — we&apos;ll update it for you.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-rpm-gray/30 last:border-0">
      <dt className="text-sm text-rpm-silver uppercase tracking-wider">{label}</dt>
      <dd className="text-rpm-white font-medium">{value}</dd>
    </div>
  );
}
