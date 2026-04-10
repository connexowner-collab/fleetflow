export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-96" />
    </div>
  );
}
