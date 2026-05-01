import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FleetFlow APP',
  description: 'FleetFlow — App do Motorista',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white max-w-md mx-auto relative">
      {children}
    </div>
  )
}
