export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Carregando...</p>
    </div>
  )
}
