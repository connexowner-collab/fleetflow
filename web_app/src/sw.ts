import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

// @ts-ignore
declare const self: Window &
  typeof globalThis & {
    __SW_MANIFEST: (string | { url: string; revision: string | null })[];
  };

// Push notification handler — typed via cast since tsconfig uses dom lib, not webworker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as any

sw.addEventListener('push', (event: { data: { json: () => unknown; text: () => string } | null; waitUntil: (p: Promise<unknown>) => void }) => {
  if (!event.data) return
  let payload: { title?: string; body?: string; tag?: string; data?: Record<string, unknown> } = {}
  try { payload = event.data.json() as typeof payload } catch { payload = { title: 'FleetFlow', body: event.data.text() } }

  const title = payload.title ?? 'FleetFlow'
  const options = {
    body:    payload.body ?? '',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-96x96.png',
    tag:     payload.tag ?? 'fleetflow',
    data:    payload.data ?? {},
    vibrate: [200, 100, 200],
  }
  event.waitUntil(sw.registration.showNotification(title, options))
})

sw.addEventListener('notificationclick', (event: { notification: { close: () => void; data: unknown }; waitUntil: (p: Promise<unknown>) => void }) => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as { url?: string }
  const url  = data.url ?? '/app/home'
  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((clients: any[]) => {
        const existing = clients.find((c: { url: string; focus: () => void; navigate: (u: string) => void }) => c.url.includes('/app/'))
        if (existing) { existing.focus(); existing.navigate(url) }
        else sw.clients.openWindow(url)
      })
  )
})

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API do APP — network-first com fallback para cache (5 min)
    {
      matcher: /^https?:\/\/.*\/api\/app\/veiculo/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-app-veiculo",
        networkTimeoutSeconds: 5,
        plugins: [{ cacheWillUpdate: async ({ response }) => response.status === 200 ? response : null }],
      }),
    },
    {
      matcher: /^https?:\/\/.*\/api\/app\/checklist/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-app-checklist",
        networkTimeoutSeconds: 5,
        plugins: [{ cacheWillUpdate: async ({ response }) => response.status === 200 ? response : null }],
      }),
    },
    {
      matcher: /^https?:\/\/.*\/api\/auth\/profile/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-profile",
        networkTimeoutSeconds: 5,
        plugins: [{ cacheWillUpdate: async ({ response }) => response.status === 200 ? response : null }],
      }),
    },
    {
      matcher: /^https?:\/\/.*\/api\/admin\/veiculos/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-veiculos",
        networkTimeoutSeconds: 5,
      }),
    },
    {
      matcher: /^https?:\/\/.*\/api\/notificacoes/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-notificacoes",
        networkTimeoutSeconds: 5,
      }),
    },
    {
      matcher: /^https?:\/\/.*\/api\/admin\/manutencao/,
      handler: new NetworkFirst({
        cacheName: "fleetflow-manutencao",
        networkTimeoutSeconds: 8,
      }),
    },
    // Assets estáticos — cache-first
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: new CacheFirst({
        cacheName: "fleetflow-images",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response && response.status === 200 ? response : null,
          },
        ],
      }),
    },
    // Fontes e CSS — stale-while-revalidate
    {
      matcher: /\.(?:woff|woff2|ttf|otf|eot)$/,
      handler: new CacheFirst({ cacheName: "fleetflow-fonts" }),
    },
    // Fallback para demais rotas
    ...defaultCache,
  ],
});

serwist.addEventListeners();
