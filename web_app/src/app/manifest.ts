import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FleetFlow - Gestão de Frotas',
    short_name: 'FleetFlow',
    description: 'Sistema Inteligente de Gestão de Frotas e Ocorrências',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    categories: ['productivity', 'utilities'],
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        url: '/',
        description: 'Painel principal',
      },
      {
        name: 'Frota',
        url: '/frota',
        description: 'Gestão de veículos',
      },
      {
        name: 'Ocorrências',
        url: '/ocorrencias',
        description: 'Registrar ocorrência',
      },
    ],
  };
}
