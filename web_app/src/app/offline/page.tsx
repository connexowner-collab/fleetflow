export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 p-8 text-white">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-4xl font-bold">
        F
      </div>
      <h1 className="text-2xl font-semibold">Sem conexão</h1>
      <p className="max-w-xs text-center text-slate-400">
        Você está offline. Verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium transition hover:bg-blue-500"
      >
        Tentar novamente
      </button>
    </div>
  );
}
