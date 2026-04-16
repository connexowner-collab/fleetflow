import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

// @ts-ignore
declare const self: Window &
  typeof globalThis & {
    __SW_MANIFEST: (string | { url: string; revision: string | null })[];
  };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API do APP — network-first com fallback para cache (5 min)
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
