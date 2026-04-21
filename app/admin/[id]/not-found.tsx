import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center
                        justify-center mx-auto mb-4">
          <span className="text-gray-400 text-xl">?</span>
        </div>
        <h1 className="font-semibold text-gray-900 mb-1">Session not found</h1>
        <p className="text-sm text-gray-500 mb-5">
          This interview session doesn&apos;t exist or may have been deleted.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm
                     font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'var(--cue-purple)' }}
        >
          ← Back to all interviews
        </Link>
      </div>
    </div>
  )
}