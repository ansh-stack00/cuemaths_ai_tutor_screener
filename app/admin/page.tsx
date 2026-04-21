import { getAllSessions } from '@/lib/supabase/helper'
import { RecommendationBadge } from '@/components/admin/RecommendationBadge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Recommendation } from '@/types'

export const dynamic = 'force-dynamic'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

  .ad-root {
    font-family: 'DM Sans', sans-serif;
    background: #0C0A1A;
    min-height: 100vh;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    color: #E8E4FF;
  }
  .ad-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }
  .ad-orb1 {
    position: fixed; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,72,220,0.22) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none; z-index: 0;
  }
  .ad-orb2 {
    position: fixed; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,180,140,0.12) 0%, transparent 70%);
    bottom: -80px; left: -80px; pointer-events: none; z-index: 0;
  }

  .ad-header {
    position: relative; z-index: 10;
    padding: 20px 40px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
  }
  .ad-logo-row { display: flex; align-items: center; gap: 10px; }
  .ad-logo-mark {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #6348DC 0%, #9B7FFF 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 15px; color: #fff;
  }
  .ad-logo-name { font-size: 14px; font-weight: 600; color: #E8E4FF; letter-spacing: -0.2px; }
  .ad-breadcrumb { font-size: 13px; color: #3D3860; margin-left: 4px; }
  .ad-new-btn {
    font-size: 12px; font-weight: 500;
    padding: 8px 16px; border-radius: 10px;
    background: rgba(99,72,220,0.12); border: 1px solid rgba(99,72,220,0.28);
    color: #9B7FFF; text-decoration: none;
    transition: background 0.2s, transform 0.15s; display: inline-block;
  }
  .ad-new-btn:hover { background: rgba(99,72,220,0.2); transform: translateY(-1px); }

  .ad-main {
    flex: 1; max-width: 880px; margin: 0 auto; width: 100%;
    padding: 40px 24px; position: relative; z-index: 10;
  }

  .ad-page-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px; font-weight: 400; color: #F0EDF8;
    letter-spacing: -0.4px; margin-bottom: 6px;
  }
  .ad-page-sub { font-size: 13px; color: #4A4568; margin-bottom: 32px; }

  /* Stats */
  .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .ad-stat-tile {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 18px 20px;
  }
  .ad-stat-label { font-size: 11px; color: #4A4568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .ad-stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 30px; font-weight: 400; color: #E8E4FF;
  }
  .ad-stat-val.green { color: #2DB48C; }
  .ad-stat-val.purple { color: #9B7FFF; }

  /* Error */
  .ad-error {
    margin-bottom: 20px; padding: 14px 18px;
    background: rgba(226,75,74,0.08); border: 1px solid rgba(226,75,74,0.2);
    border-radius: 14px; font-size: 13px; color: #F09595;
  }

  /* Empty state */
  .ad-empty {
    text-align: center; padding: 80px 24px;
  }
  .ad-empty-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(99,72,220,0.1); border: 1px solid rgba(99,72,220,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .ad-empty-title { font-size: 16px; font-weight: 500; color: #C8C2E8; margin-bottom: 6px; }
  .ad-empty-desc { font-size: 13px; color: #4A4568; margin-bottom: 24px; line-height: 1.6; }
  .ad-empty-cta {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 12px 22px; border-radius: 12px;
    background: linear-gradient(135deg, #6348DC, #8B6FFF);
    font-size: 13px; font-weight: 600; color: #fff; text-decoration: none;
    transition: opacity 0.2s, transform 0.15s;
  }
  .ad-empty-cta:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Table header */
  .ad-table-header {
    display: grid;
    grid-template-columns: 1fr 90px 110px 28px;
    gap: 12px; align-items: center;
    padding: 0 20px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 8px;
  }
  .ad-th { font-size: 10px; font-weight: 500; color: #3D3860; text-transform: uppercase; letter-spacing: 0.6px; }
  .ad-th.right { text-align: right; }

  /* Session rows */
  .ad-sessions { display: flex; flex-direction: column; gap: 6px; }
  .ad-session-row {
    display: grid;
    grid-template-columns: 1fr 90px 110px 28px;
    gap: 12px; align-items: center;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 16px 20px;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
    cursor: pointer;
  }
  .ad-session-row:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(99,72,220,0.3);
  }

  .ad-candidate { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .ad-avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #6348DC, #9B7FFF);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600; color: #fff;
  }
  .ad-candidate-name { font-size: 13px; font-weight: 500; color: #C8C2E8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-candidate-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
  .ad-meta-text { font-size: 11px; color: #A9A9A9; }
  .ad-meta-dot { font-size: 11px; color: #A9A9A9; }

  .ad-score {
    text-align: right;
    font-family: 'DM Mono', monospace;
    font-size: 15px; font-weight: 600; color: #A9A9A9;
  }
  .ad-score-sub { font-size: 11px; color: #A9A9A9; font-weight: 400; }
  .ad-score-empty { font-size: 11px; color: #2E2B48; text-align: right; }

  .ad-badge-col { display: flex; justify-content: flex-end; }

  .ad-status-pill {
    font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px;
  }
  .ad-status-pill.in-progress {
    background: rgba(220,165,60,0.12); border: 1px solid rgba(220,165,60,0.25); color: #DCA53C;
  }
  .ad-status-pill.pending {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #4A4568;
  }

  .ad-arrow { color: #2E2B48; transition: color 0.2s; }
  .ad-session-row:hover .ad-arrow { color: #6348DC; }

  .ad-in-progress-note {
    text-align: center; font-size: 11px; color: #2E2B48; margin-top: 16px;
  }

  @media (max-width: 600px) {
    .ad-stats { grid-template-columns: repeat(2, 1fr); }
    .ad-table-header { display: none; }
    .ad-session-row { grid-template-columns: 1fr auto; }
    .ad-score { display: none; }
    .ad-header { padding: 16px 20px; }
    .ad-main { padding: 28px 16px; }
  }
`

export default async function AdminPage() {
  let sessions: Awaited<ReturnType<typeof getAllSessions>> = []
  let dbError = ''

  try {
    sessions = await getAllSessions()
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : 'Failed to load sessions'
  }

  const completed  = sessions.filter(s => s.status === 'completed').length
  const inProgress = sessions.filter(s => s.status === 'in_progress').length
  const advanced   = sessions.filter(s => s.overall_recommendation === 'Advance').length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="ad-root">
        <div className="ad-bg-grid" />
        <div className="ad-orb1" />
        <div className="ad-orb2" />

        {/* Header */}
        <header className="ad-header">
          <div className="ad-logo-row">
            <div className="ad-logo-mark">C</div>
            <span className="ad-logo-name">Cuemath</span>
            <span className="ad-breadcrumb">/ Admin</span>
          </div>
          <Link href="/welcome" className="ad-new-btn">+ New interview</Link>
        </header>

        <main className="ad-main">
          <h1 className="ad-page-title">Tutor Screener</h1>
          <p className="ad-page-sub">All candidate interviews and evaluation results</p>

          {/* Stats */}
          {sessions.length > 0 && (
            <div className="ad-stats">
              <div className="ad-stat-tile">
                <div className="ad-stat-label">Total</div>
                <div className="ad-stat-val">{sessions.length}</div>
              </div>
              <div className="ad-stat-tile">
                <div className="ad-stat-label">Completed</div>
                <div className="ad-stat-val purple">{completed}</div>
              </div>
              <div className="ad-stat-tile">
                <div className="ad-stat-label">Advanced</div>
                <div className="ad-stat-val green">{advanced}</div>
              </div>
              <div className="ad-stat-tile">
                <div className="ad-stat-label">In progress</div>
                <div className="ad-stat-val">{inProgress}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {dbError && (
            <div className="ad-error">
              <strong>Database error:</strong> {dbError}
            </div>
          )}

          {/* Empty state */}
          {sessions.length === 0 && !dbError && (
            <div className="ad-empty">
              <div className="ad-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="#9B7FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="ad-empty-title">No interviews yet</p>
              <p className="ad-empty-desc">
                Completed interviews will appear here with rubric scores and AI recommendations.
              </p>
              <Link href="/welcome" className="ad-empty-cta">
                Start a test interview →
              </Link>
            </div>
          )}

          {/* Table */}
          {sessions.length > 0 && (
            <>
              <div className="ad-table-header">
                <div className="ad-th">Candidate</div>
                <div className="ad-th right">Score</div>
                <div className="ad-th right">Recommendation</div>
                <div />
              </div>

              <div className="ad-sessions">
                {sessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/admin/${session.id}`}
                    className="ad-session-row"
                  >
                    {/* Candidate info */}
                    <div className="ad-candidate">
                      <div className="ad-avatar">
                        {session.candidate_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="ad-candidate-name">{session.candidate_name}</div>
                        <div className="ad-candidate-meta">
                          <span className="ad-meta-text">{session.candidate_email}</span>
                          <span className="ad-meta-dot">·</span>
                          <span className="ad-meta-text">{formatDate(session.started_at)}</span>
                          {session.duration_seconds && (
                            <>
                              <span className="ad-meta-dot">·</span>
                              <span className="ad-meta-text">
                                {Math.round(session.duration_seconds / 60)} min
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div>
                      {session.overall_score ? (
                        <div className="ad-score">
                          {Number(session.overall_score).toFixed(1)}
                          <span className="ad-score-sub">/5</span>
                        </div>
                      ) : (
                        <div className="ad-score-empty">—</div>
                      )}
                    </div>

                    {/* Recommendation / status */}
                    <div className="ad-badge-col">
                      {session.overall_recommendation ? (
                        <RecommendationBadge
                          recommendation={session.overall_recommendation as Recommendation}
                        />
                      ) : (
                        <span className={`ad-status-pill ${
                          session.status === 'in_progress' ? 'in-progress' : 'pending'
                        }`}>
                          {session.status === 'in_progress' ? 'In progress' : session.status}
                        </span>
                      )}
                    </div>

                    {/* Arrow */}
                    <div>
                      <svg className="ad-arrow" width="16" height="16" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {inProgress > 0 && (
                <p className="ad-in-progress-note">
                  {inProgress} interview{inProgress > 1 ? 's' : ''} in progress — refresh to see latest scores
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}