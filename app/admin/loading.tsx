export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i}
                 className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="w-8 h-7 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="w-20 h-3 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Row skeletons */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i}
                 className="flex items-center gap-4 bg-white rounded-xl
                            border border-gray-200 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse
                              flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-32 h-3.5 bg-gray-200 rounded animate-pulse" />
                <div className="w-48 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="w-16 h-6 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}