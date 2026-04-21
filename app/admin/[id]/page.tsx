import { getSession, getAssessment, getMessages } from '@/lib/supabase/helper'
import { DimensionBar }        from '@/components/admin/DimensionBar'
import { RecommendationBadge } from '@/components/admin/RecommendationBadge'
import { ScoreRing }           from '@/components/admin/ScoreRing'
import { formatDate }          from '@/lib/utils'
import Link        from 'next/link'
import { notFound } from 'next/navigation'
import type { Recommendation } from '@/types'

export const dynamic = 'force-dynamic'

const DIM_LABELS: Record<string, string> = {
  communication_clarity: 'Communication clarity',
  warmth_and_patience:   'Warmth & patience',
  ability_to_simplify:   'Ability to simplify',
  english_fluency:       'English fluency',
  adaptability:          'Adaptability',
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

  .as-root {
    font-family: 'DM Sans', sans-serif;
    background: #0C0A1A;
    min-height: 100vh;
    display: flex; flex-direction: column;
    position: relative;
    color: #E8E4FF;
  }
  .as-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }
  .as-orb1 {
    position: fixed; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,72,220,0.22) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none; z-index: 0;
  }
  .as-orb2 {
    position: fixed; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,180,140,0.12) 0%, transparent 70%);
    bottom: -80px; left: -80px; pointer-events: none; z-index: 0;
  }

  /* Header */
  .as-header {
    position: sticky; top: 0; z-index: 20;
    background: rgba(12,10,26,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 16px 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .as-back {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: #4A4568;
    text-decoration: none; transition: color 0.2s;
  }
  .as-back:hover { color: #9B7FFF; }
  .as-logo-row { display: flex; align-items: center; gap: 8px; }
  .as-logo-mark {
    width: 28px; height: 28px; border-radius: 7px;
    background: linear-gradient(135deg, #6348DC, #9B7FFF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 13px; color: #fff;
  }
  .as-logo-name { font-size: 13px; font-weight: 600; color: #C8C2E8; }

  /* Main */
  .as-main {
    max-width: 740px; margin: 0 auto; width: 100%;
    padding: 40px 24px 80px;
    position: relative; z-index: 10;
    display: flex; flex-direction: column; gap: 20px;
  }

  /* Animation utility */
  .as-fade { animation: asFadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
  .as-fade-1 { animation-delay: 0.05s; }
  .as-fade-2 { animation-delay: 0.12s; }
  .as-fade-3 { animation-delay: 0.19s; }
  .as-fade-4 { animation-delay: 0.26s; }
  .as-fade-5 { animation-delay: 0.33s; }
  @keyframes asFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Card base */
  .as-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px; overflow: hidden;
  }
  .as-card-body { padding: 28px; }

  /* Accent bar */
  .as-accent-bar { height: 3px; width: 100%; }

  /* Hero */
  .as-hero-inner { display: flex; align-items: flex-start; gap: 20px; }
  .as-avatar {
    width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #6348DC, #9B7FFF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 22px; color: #fff;
  }
  .as-hero-info { flex: 1; min-width: 0; }
  .as-hero-name {
    font-family: 'DM Serif Display', serif;
    font-size: 26px; font-weight: 400; color: #F0EDF8;
    letter-spacing: -0.3px; margin-bottom: 3px;
  }
  .as-hero-email { font-size: 13px; color: #808080; margin-bottom: 10px; }
  .as-hero-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .as-meta-chip {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #A9A9A9;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 3px 10px;
  }
  .as-meta-chip svg { flex-shrink: 0; }

  .as-score-block { display: flex; flex-direction: column; align-items: center; gap: 10px; flex-shrink: 0; }

  .as-summary {
    margin-top: 22px; padding-top: 22px;
    border-top: 1px solid rgba(255,255,255,0.06);
    font-size: 14px; color: #A9A9A9; line-height: 1.7; font-weight: 300;
  }

  /* No assessment */
  .as-pending {
    padding: 22px 28px;
    background: rgba(220,165,60,0.07); border: 1px solid rgba(220,165,60,0.2);
    border-radius: 16px; display: flex; gap: 14px; align-items: flex-start;
  }
  .as-pending-icon {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: rgba(220,165,60,0.15); border: 1px solid rgba(220,165,60,0.3);
    display: flex; align-items: center; justify-content: center;
  }
  .as-pending-title { font-size: 13px; font-weight: 500; color: #DCA53C; margin-bottom: 3px; }
  .as-pending-desc  { font-size: 12px; color: #7A6A35; line-height: 1.55; }

  /* Section header */
  .as-section-header { padding: 20px 28px 0; }
  .as-section-title {
    font-size: 14px; font-weight: 600; color: #C8C2E8; margin-bottom: 3px;
  }
  .as-section-sub { font-size: 11px; color: #A9A9A9; }
  .as-section-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 16px 0; }

  /* Dimension bars wrapper */
  .as-dims-body { padding: 0 28px 24px; }

  /* Flags & standouts */
  .as-flags-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .as-flags-card {
    border-radius: 18px; padding: 22px; overflow: hidden;
  }
  .as-flags-card.red {
    background: rgba(226,75,74,0.07); border: 1px solid rgba(226,75,74,0.18);
  }
  .as-flags-card.green {
    background: rgba(45,180,140,0.07); border: 1px solid rgba(45,180,140,0.2);
  }
  .as-flags-heading {
    display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .as-flags-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .as-flags-icon.red   { background: rgba(226,75,74,0.2); color: #F09595; }
  .as-flags-icon.green { background: rgba(45,180,140,0.2); color: #2DB48C; }
  .as-flags-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.7px; text-transform: uppercase;
  }
  .as-flags-label.red   { color: #F09595; }
  .as-flags-label.green { color: #2DB48C; }
  .as-flag-item {
    display: flex; gap: 8px; margin-bottom: 9px; font-size: 13px; line-height: 1.55;
  }
  .as-flag-item.red   { color: #C4726F; }
  .as-flag-item.green { color: #1D9E75; }
  .as-flag-bullet { flex-shrink: 0; margin-top: 2px; opacity: 0.6; }

  /* Transcript */
  .as-transcript-body {
    padding: 0 28px 28px; display: flex; flex-direction: column; gap: 14px;
    max-height: 480px; overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(99,72,220,0.3) transparent;
  }
  .as-transcript-body::-webkit-scrollbar { width: 4px; }
  .as-transcript-body::-webkit-scrollbar-track { background: transparent; }
  .as-transcript-body::-webkit-scrollbar-thumb { background: rgba(99,72,220,0.3); border-radius: 4px; }
  .as-transcript-body::-webkit-scrollbar-thumb:hover { background: rgba(99,72,220,0.55); }
  .as-msg { display: flex; gap: 10px; }
  .as-msg.candidate { flex-direction: row-reverse; }
  .as-msg-avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
  }
  .as-msg-avatar.interviewer { background: rgba(99,72,220,0.3); color: #9B7FFF; }
  .as-msg-avatar.candidate   { background: rgba(45,180,140,0.2); color: #2DB48C; }
  .as-msg-col { max-width: 78%; display: flex; flex-direction: column; gap: 4px; }
  .as-msg.candidate .as-msg-col { align-items: flex-end; }
  .as-bubble {
    padding: 11px 16px; border-radius: 16px;
    font-size: 13px; line-height: 1.65;
  }
  .as-bubble.interviewer {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    color: #C8C2E8; border-top-left-radius: 4px;
  }
  .as-bubble.candidate {
    background: rgba(99,72,220,0.12); border: 1px solid rgba(99,72,220,0.22);
    color: #B8B0E8; border-top-right-radius: 4px;
  }
  .as-msg-name { font-size: 10px; color: #2E2B48; padding: 0 4px; }

  @media (max-width: 600px) {
    .as-flags-grid { grid-template-columns: 1fr; }
    .as-hero-inner { flex-direction: column; }
    .as-score-block { flex-direction: row; align-self: flex-start; }
    .as-header { padding: 14px 20px; }
    .as-main { padding: 28px 16px 60px; }
    .as-card-body, .as-dims-body, .as-transcript-body { padding-left: 18px; padding-right: 18px; }
    .as-section-header { padding-left: 18px; padding-right: 18px; }
  }
`

function accentColor(recommendation?: string | null) {
  if (recommendation === 'Advance') return 'linear-gradient(90deg, #1D9E75, #2DB48C)'
  if (recommendation === 'Hold')    return 'linear-gradient(90deg, #BA7517, #DCA53C)'
  if (recommendation === 'Reject')  return 'linear-gradient(90deg, #A32D2D, #E24B4A)'
  return 'rgba(255,255,255,0.06)'
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

  const dims   = assessment?.rubric?.dimensions
  const rubric = assessment?.rubric
  const candidateResponses = messages.filter(m => m.role === 'candidate').length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="as-root">
        <div className="as-bg-grid" />
        <div className="as-orb1" />
        <div className="as-orb2" />

        {/* Header */}
        <header className="as-header">
          <Link href="/admin" className="as-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            All interviews
          </Link>
          <div className="as-logo-row">
            <div className="as-logo-mark">C</div>
            <span className="as-logo-name">Cuemath</span>
          </div>
        </header>

        <main className="as-main">

          {/* ── Hero card ── */}
          <div className="as-card as-fade as-fade-1">
            <div
              className="as-accent-bar"
              style={{ background: accentColor(assessment?.overall_recommendation) }}
            />
            <div className="as-card-body">
              <div className="as-hero-inner">

                {/* Avatar + info */}
                <div className="as-avatar">
                  {session.candidate_name.charAt(0).toUpperCase()}
                </div>
                <div className="as-hero-info">
                  <h1 className="as-hero-name">{session.candidate_name}</h1>
                  <p className="as-hero-email">{session.candidate_email}</p>
                  <div className="as-hero-meta">
                    <span className="as-meta-chip">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      {formatDate(session.started_at)}
                    </span>
                    {session.duration_seconds && (
                      <span className="as-meta-chip">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                        {Math.round(session.duration_seconds / 60)} min
                      </span>
                    )}
                    <span className="as-meta-chip">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      {candidateResponses} responses
                    </span>
                  </div>
                </div>

                {/* Score ring + badge */}
                {assessment && (
                  <div className="as-score-block">
                    <ScoreRing score={Number(assessment.overall_score)} size={72} />
                    <RecommendationBadge
                      recommendation={assessment.overall_recommendation as Recommendation}
                      size="lg"
                    />
                  </div>
                )}
              </div>

              {/* Summary */}
              {rubric?.summary && (
                <p className="as-summary">{rubric.summary}</p>
              )}
            </div>
          </div>

          {/* ── No assessment yet ── */}
          {!assessment && (
            <div className="as-pending as-fade as-fade-2">
              <div className="as-pending-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="#DCA53C" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
              </div>
              <div>
                <p className="as-pending-title">Assessment not generated yet</p>
                <p className="as-pending-desc">
                  The interview may still be in progress, or assessment generation failed.
                  Check the session status in Supabase.
                </p>
              </div>
            </div>
          )}

          {/* ── Dimension scores ── */}
          {dims && (
            <div className="as-card as-fade as-fade-2">
              <div className="as-section-header">
                <p className="as-section-title">Evaluation breakdown</p>
                <p className="as-section-sub">Scored 1–5 with evidence from the transcript</p>
              </div>
              <div className="as-section-divider" style={{ margin: '16px 28px 0' }} />
              <div className="as-dims-body" style={{ paddingTop: 20 }}>
                {Object.entries(dims).map(([key, dim]) => (
                  <DimensionBar
                    key={key}
                    label={DIM_LABELS[key] ?? key}
                    score={dim.score}
                    max={dim.max}
                    notes={dim.notes}
                    evidence={dim.evidence}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Red flags + standout moments ── */}
          {rubric && (rubric.red_flags.length > 0 || rubric.standout_moments.length > 0) && (
            <div className="as-flags-grid as-fade as-fade-3">
              {rubric.red_flags.length > 0 && (
                <div className="as-flags-card red">
                  <div className="as-flags-heading">
                    <span className="as-flags-icon red">!</span>
                    <span className="as-flags-label red">Red flags</span>
                  </div>
                  <ul>
                    {rubric.red_flags.map((flag, i) => (
                      <li key={i} className="as-flag-item red">
                        <span className="as-flag-bullet">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rubric.standout_moments.length > 0 && (
                <div className="as-flags-card green">
                  <div className="as-flags-heading">
                    <span className="as-flags-icon green">★</span>
                    <span className="as-flags-label green">Standout moments</span>
                  </div>
                  <ul>
                    {rubric.standout_moments.map((moment, i) => (
                      <li key={i} className="as-flag-item green">
                        <span className="as-flag-bullet">•</span>
                        <span>{moment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Full transcript ── */}
          {messages.length > 0 && (
            <div className="as-card as-fade as-fade-4">
              <div className="as-section-header">
                <p className="as-section-title">Full transcript</p>
                <p className="text-sm text-gray-500">
                  {messages.length} messages · {candidateResponses} candidate responses
                </p>
              </div>
              <div className="as-section-divider" style={{ margin: '16px 28px 0' }} />
              <div className="as-transcript-body" style={{ paddingTop: 20 }}>
                {messages.map((msg, i) => (
                  <div key={msg.id ?? i} className={`as-msg ${msg.role}`}>
                    <div className={`as-msg-avatar ${msg.role}`}>
                      {msg.role === 'interviewer' ? 'P' : 'C'}
                    </div>
                    <div className="as-msg-col">
                      <div className={`as-bubble ${msg.role}`}>{msg.content}</div>
                      <p className="as-msg-name">
                        {msg.role === 'interviewer' ? 'Priya' : 'Candidate'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}