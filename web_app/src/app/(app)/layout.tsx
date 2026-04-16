import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'FleetFlow APP',
  description: 'FleetFlow — App do Motorista',
  applicationName: 'FleetFlow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FleetFlow',
  },
}

export const viewport: Viewport = {
  themeColor: '#0056B3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white max-w-md mx-auto relative">
      {children}
    </div>
  )
}
