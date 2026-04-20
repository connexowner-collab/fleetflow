export default function ChecklistLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto animate-pulse">

      {/* Header skeleton */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-xl" />
          <div>
            <div className="h-2.5 w-16 bg-slate-700 rounded mb-1.5" />
            <div className="h-5 w-36 bg-slate-700 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-800 rounded-xl" />
      </div>

      {/* Botão skeleton */}
      <div className="px-5 mb-5">
        <div className="h-14 bg-slate-700 rounded-xl w-full" />
      </div>

      {/* Label histórico */}
      <div className="px-5 mb-3">
        <div className="h-3 w-20 bg-slate-800 rounded" />
      </div>

      {/* Cards skeleton */}
      <div className="px-5 space-y-3 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-between mb-3">
              <div>
                <div className="h-4 w-28 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-36 bg-slate-700 rounded" />
              </div>
              <div className="h-6 w-24 bg-slate-700 rounded-full" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-700 rounded" />
              <div className="h-3 w-14 bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav skeleton */}
      <div className="border-t border-slate-800 px-2 py-3 flex justify-around">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 bg-slate-800 rounded" />
            <div className="w-8 h-2 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
