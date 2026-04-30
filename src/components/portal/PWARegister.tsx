'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/rpm-auto-lab/sw.js', { scope: '/rpm-auto-lab/' })
        .catch((err) => {
          // Service worker is optional; don't break the app if registration fails.
          console.warn('[sw] registration failed:', err);
        });
    }
  }, []);
  return null;
}
