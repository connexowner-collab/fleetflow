export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div suppressHydrationWarning className="flex flex-col min-h-screen bg-slate-900 text-white max-w-md mx-auto relative">{children}</div>
}
