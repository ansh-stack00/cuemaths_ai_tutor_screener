import { getAllSessions } from '@/lib/supabase/helper'
import { formatDate, getRecommendationColor } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  let sessions = []
  let dbError  = ''

  try {
    sessions = await getAllSessions()
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : 'Failed to load sessions'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--cue-purple)' }}>
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">Cuemath</span>
            <span className="text-gray-300 mx-2">/</span>
            <span className="text-sm text-gray-500">Interview Results</span>
          </div>
          <span className="text-xs text-gray-400">{sessions.length} interviews</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {dbError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl
                          text-sm text-red-700">
            <strong>DB Error:</strong> {dbError}
          </div>
        )}

        {sessions.length === 0 && !dbError ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-1">No interviews yet</p>
            <p className="text-sm mb-4">Completed sessions will appear here.</p>
            <Link href="/welcome" className="text-sm underline"
                  style={{ color: 'var(--cue-purple)' }}>
              Start a test interview →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/admin/${session.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5
                           hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{session.candidate_name}</p>
                    <p className="text-sm text-gray-500">{session.candidate_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.overall_recommendation && (
                      <span className={`text-xs font-semibold px-2.5 py-1
                                        rounded-full border ${
                        getRecommendationColor(session.overall_recommendation)
                      }`}>
                        {session.overall_recommendation}
                      </span>
                    )}
                    {session.overall_score && (
                      <span className="text-sm font-mono font-medium text-gray-700">
                        {session.overall_score}/5
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      session.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : session.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                  <span>{formatDate(session.started_at)}</span>
                  {session.duration_seconds && (
                    <span>{Math.round(session.duration_seconds / 60)} min</span>
                  )}
                  <span>{session.candidate_turns} candidate responses</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}