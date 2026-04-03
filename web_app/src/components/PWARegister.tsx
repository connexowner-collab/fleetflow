'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — can notify user here if desired
              console.info('[FleetFlow] Nova versão disponível. Recarregue para atualizar.');
            }
          });
        });
      })
      .catch((err) => console.error('[FleetFlow] SW registration failed:', err));
  }, []);

  return null;
}
