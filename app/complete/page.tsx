'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

  .cp-root {
    font-family: 'DM Sans', sans-serif;
    background: #0C0A1A;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    color: #E8E4FF;
  }
  .cp-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }
  .cp-orb1 {
    position: fixed; width: 480px; height: 480px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,180,140,0.22) 0%, transparent 70%);
    top: -140px; right: -100px; pointer-events: none; z-index: 0;
  }
  .cp-orb2 {
    position: fixed; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,72,220,0.2) 0%, transparent 70%);
    bottom: -80px; left: -80px; pointer-events: none; z-index: 0;
  }

  .cp-header {
    position: relative; z-index: 10;
    padding: 20px 40px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .cp-logo-row { display: flex; align-items: center; gap: 10px; }
  .cp-logo-mark {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #6348DC 0%, #9B7FFF 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 15px; color: #fff;
  }
  .cp-logo-name { font-size: 14px; font-weight: 600; color: #E8E4FF; letter-spacing: -0.2px; }
  .cp-header-badge {
    font-size: 11px; font-weight: 500; color: #2DB48C;
    background: rgba(45,180,140,0.12); border: 1px solid rgba(45,180,140,0.3);
    border-radius: 20px; padding: 4px 13px;
  }

  .cp-main {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 48px 24px; position: relative; z-index: 10;
  }

  .cp-card {
    width: 100%; max-width: 520px;
    display: flex; flex-direction: column; gap: 24px;
    animation: cpFadeUp 0.6s cubic-bezier(0.4,0,0.2,1) both;
  }
  @keyframes cpFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Success hero */
  .cp-hero {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; padding: 40px 36px;
    text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;
  }
  .cp-check-ring {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(45,180,140,0.1); border: 1px solid rgba(45,180,140,0.3);
    display: flex; align-items: center; justify-content: center;
    animation: checkPop 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes checkPop {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  .cp-check-inner {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(45,180,140,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .cp-h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 32px; font-weight: 400; color: #F0EDF8;
    letter-spacing: -0.4px; margin: 0;
  }
  .cp-h1 em { color: #2DB48C; font-style: italic; }
  .cp-desc {
    font-size: 14px; color: #5C5578; line-height: 1.7;
    max-width: 380px; font-weight: 300; margin: 0;
  }

  /* Stats row */
  .cp-stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  .cp-stat-tile {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .cp-stat-icon { font-size: 18px; margin-bottom: 4px; }
  .cp-stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; color: #E8E4FF; font-weight: 400;
  }
  .cp-stat-label {
    font-size: 11px; color: #4A4568; text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* Next steps */
  .cp-steps-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px; overflow: hidden;
  }
  .cp-steps-header {
    padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 11px; font-weight: 500; color: #4A4568;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .cp-steps-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
  .cp-step { display: flex; gap: 14px; align-items: flex-start; }
  .cp-step-num {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600;
  }
  .cp-step-num.done  { background: rgba(45,180,140,0.2);  color: #2DB48C; border: 1px solid rgba(45,180,140,0.35); }
  .cp-step-num.now   { background: rgba(99,72,220,0.2);   color: #9B7FFF; border: 1px solid rgba(99,72,220,0.35); }
  .cp-step-num.later { background: rgba(255,255,255,0.05); color: #4A4568; border: 1px solid rgba(255,255,255,0.08); }
  .cp-step-connector {
    width: 1px; height: 16px; background: rgba(255,255,255,0.07);
    margin: 4px 0 4px 13px;
  }
  .cp-step-title { font-size: 13px; font-weight: 500; color: #C8C2E8; margin-bottom: 2px; }
  .cp-step-desc  { font-size: 12px; color: #4A4568; line-height: 1.55; }

  /* Footer row */
  .cp-footer-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 4px;
  }
  .cp-ref {
    font-size: 11px; color: #3D3860;
    display: flex; align-items: center; gap: 6px;
  }
  .cp-ref-label { color: #3D3860; }
  .cp-ref-code {
    font-family: 'DM Mono', monospace; font-size: 11px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; padding: 3px 8px; color: #5C5578;
  }
  .cp-home-link {
    font-size: 13px; font-weight: 500; color: #9B7FFF;
    text-decoration: none; display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 10px;
    background: rgba(99,72,220,0.1); border: 1px solid rgba(99,72,220,0.25);
    transition: background 0.2s, transform 0.15s;
  }
  .cp-home-link:hover { background: rgba(99,72,220,0.18); transform: translateY(-1px); }

  /* Suspense spinner */
  .cp-spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(99,72,220,0.2);
    border-top-color: #6348DC;
    animation: cpSpin 0.8s linear infinite;
  }
  @keyframes cpSpin { to { transform: rotate(360deg); } }
`

function CompleteContent() {
  const params    = useSearchParams()
  const sessionId = params.get('session')

  const steps = [
    {
      num: '✓', cls: 'done',
      title: 'Interview recorded',
      desc: 'Your voice responses have been captured and saved securely.',
    },
    {
      num: '2', cls: 'now',
      title: 'AI evaluation underway',
      desc: 'Your answers are being scored across 5 dimensions automatically.',
    },
    {
      num: '3', cls: 'later',
      title: 'Human review',
      desc: 'A Cuemath hiring team member will review the AI assessment.',
    },
    {
      num: '4', cls: 'later',
      title: 'We get back to you',
      desc: 'Expect to hear from us within 2–3 business days.',
    },
  ]

  return (
    <>
      <style>{styles}</style>
      <div className="cp-root">
        <div className="cp-bg-grid" />
        <div className="cp-orb1" />
        <div className="cp-orb2" />

        {/* Header */}
        <header className="cp-header">
          <div className="cp-logo-row">
            <div className="cp-logo-mark">C</div>
            <span className="cp-logo-name">Cuemath</span>
          </div>
          <span className="cp-header-badge">Interview complete</span>
        </header>

        <main className="cp-main">
          <div className="cp-card">

            {/* Hero */}
            <div className="cp-hero">
              <div className="cp-check-ring">
                <div className="cp-check-inner">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                       stroke="#2DB48C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="cp-h1">
                  Well done,<br />you&apos;re <em>all set!</em>
                </h1>
              </div>
              <p className="cp-desc">
                Thank you for speaking with Priya. Our hiring team will review your
                responses and be in touch within 2–3 business days.
              </p>
            </div>

            {/* Stats */}
            <div className="cp-stats">
              <div className="cp-stat-tile">
                <div className="cp-stat-icon">🎙</div>
                <div className="cp-stat-val">5</div>
                <div className="cp-stat-label">Questions answered</div>
              </div>
              <div className="cp-stat-tile">
                <div className="cp-stat-icon">📊</div>
                <div className="cp-stat-val">5</div>
                <div className="cp-stat-label">Dimensions scored</div>
              </div>
              <div className="cp-stat-tile">
                <div className="cp-stat-icon">⏱</div>
                <div className="cp-stat-val">2–3</div>
                <div className="cp-stat-label">Days to hear back</div>
              </div>
            </div>

            {/* Next steps */}
            <div className="cp-steps-card">
              <div className="cp-steps-header">What happens next</div>
              <div className="cp-steps-body">
                {steps.map((s, i) => (
                  <div key={s.title}>
                    <div className="cp-step">
                      <div className={`cp-step-num ${s.cls}`}>{s.num}</div>
                      <div>
                        <div className="cp-step-title">{s.title}</div>
                        <div className="cp-step-desc">{s.desc}</div>
                      </div>
                    </div>
                    {i < steps.length - 1 && <div className="cp-step-connector" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer row */}
            <div className="cp-footer-row">
              {sessionId ? (
                <div className="cp-ref">
                  <span className="cp-ref-label">Ref</span>
                  <span className="cp-ref-code">{sessionId}</span>
                </div>
              ) : <span />}
              <Link href="/welcome" className="cp-home-link">
                ← Return to home
              </Link>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#0C0A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="cp-spinner" />
      </div>
    }>
      <CompleteContent />
    </Suspense>
  )
}