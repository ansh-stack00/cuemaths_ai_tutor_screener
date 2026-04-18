import { getSession, getAssessment, getMessages } from '@/lib/supabase/helper'
import { formatDate, getRecommendationColor, scoreToLabel } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const DIM_LABELS: Record<string, string> = {
  communication_clarity: 'Communication clarity',
  warmth_and_patience:   'Warmth & patience',
  ability_to_simplify:   'Ability to simplify',
  english_fluency:       'English fluency',
  adaptability:          'Adaptability',
}

export default async function AdminSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [session, assessment, messages] = await Promise.all([
    getSession(id),
    getAssessment(id),
    getMessages(id),
  ])

  if (!session) notFound()

  const dims = assessment?.rubric?.dimensions

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← All interviews
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Candidate card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {session.candidate_name}
              </h1>
              <p className="text-gray-500 text-sm">{session.candidate_email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(session.started_at)}
              </p>
            </div>
            {assessment && (
              <div className="text-right">
                <span className={`inline-block text-sm font-semibold px-3 py-1.5
                                  rounded-full border ${
                  getRecommendationColor(assessment.overall_recommendation)
                }`}>
                  {assessment.overall_recommendation}
                </span>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {assessment.overall_score}
                  <span className="text-sm text-gray-400">/5</span>
                </p>
                <p className="text-xs text-gray-500">
                  {scoreToLabel(assessment.overall_score)}
                </p>
              </div>
            )}
          </div>
          {assessment?.rubric?.summary && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed
                          border-t border-gray-100 pt-4">
              {assessment.rubric.summary}
            </p>
          )}
        </div>

        {/* Dimension scores */}
        {dims && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Evaluation breakdown</h2>
            <div className="space-y-5">
              {Object.entries(dims).map(([key, dim]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {DIM_LABELS[key]}
                    </span>
                    <span className="text-sm font-mono text-gray-600">
                      {dim.score}/{dim.max}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:      `${(dim.score / dim.max) * 100}%`,
                        background: dim.score >= 4 ? '#059669'
                                  : dim.score >= 3 ? '#D97706' : '#DC2626',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{dim.notes}</p>
                  {dim.evidence.map((quote, i) => (
                    <p key={i} className="text-xs text-gray-600 italic
                                         pl-3 border-l-2 border-gray-200 mb-1">
                      &ldquo;{quote}&rdquo;
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red flags + standouts */}
        {assessment?.rubric && (
          <div className="grid grid-cols-2 gap-4">
            {assessment.rubric.red_flags.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 mb-2
                               uppercase tracking-wider">Red flags</p>
                <ul className="space-y-1">
                  {assessment.rubric.red_flags.map((f, i) => (
                    <li key={i} className="text-sm text-red-700">• {f}</li>
                  ))}
                </ul>
              </div>
            )}
            {assessment.rubric.standout_moments.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-2
                               uppercase tracking-wider">Standout moments</p>
                <ul className="space-y-1">
                  {assessment.rubric.standout_moments.map((m, i) => (
                    <li key={i} className="text-sm text-emerald-700">• {m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Full transcript</h2>
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id}
                   className={`flex gap-3 ${
                     msg.role === 'candidate' ? 'flex-row-reverse' : ''
                   }`}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center
                                justify-center text-xs font-semibold"
                     style={msg.role === 'interviewer'
                       ? { background: 'var(--cue-purple)', color: 'white' }
                       : { background: '#F3F4F6', color: '#374151' }
                     }>
                  {msg.role === 'interviewer' ? 'P' : 'C'}
                </div>
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                     style={msg.role === 'interviewer'
                       ? { background: '#F9FAFB', color: '#374151' }
                       : { background: 'var(--cue-purple-light)', color: '#1F2937' }
                     }>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}