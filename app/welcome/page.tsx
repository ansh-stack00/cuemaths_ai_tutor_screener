'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'ok' | 'denied'>('idle')

  async function testMic() {
    setMicStatus('testing')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setMicStatus('ok')
    } catch {
      setMicStatus('denied')
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both fields.')
      return
    }
    if (micStatus !== 'ok') {
      setError('Please test your microphone first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res       = await fetch('/api/session/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const { sessionId } = await res.json()
      router.push(`/interview?session=${sessionId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const micDotColor =
    micStatus === 'ok'      ? '#2DB48C' :
    micStatus === 'denied'  ? '#E24B4A' :
    micStatus === 'testing' ? '#DCA53C' :
    '#3D3860'

  const micLabel =
    micStatus === 'idle'    ? 'Test your microphone first' :
    micStatus === 'testing' ? 'Checking access...' :
    micStatus === 'ok'      ? 'Microphone ready' :
    'Access denied — allow mic in browser settings'

  const canSubmit = name.trim() && email.trim() && micStatus === 'ok' && !loading

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .cue-root {
          font-family: 'DM Sans', sans-serif;
          background: #0C0A1A;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .bg-orb1 {
          position: fixed; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,72,220,0.3) 0%, transparent 70%);
          top: -140px; right: -100px; pointer-events: none; z-index: 0;
        }
        .bg-orb2 {
          position: fixed; width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(45,180,140,0.18) 0%, transparent 70%);
          bottom: 0; left: -100px; pointer-events: none; z-index: 0;
        }
        .bg-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none; z-index: 0;
        }

        .cue-header {
          position: relative; z-index: 10;
          padding: 20px 40px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .logo-row { display: flex; align-items: center; gap: 10px; }
        .logo-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #6348DC 0%, #9B7FFF 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 16px; color: #fff;
        }
        .logo-name {
          font-size: 15px; font-weight: 600; color: #E8E4FF; letter-spacing: -0.2px;
        }
        .header-badge {
          font-size: 11px; font-weight: 500; color: #A89FD8;
          background: rgba(99,72,220,0.15); border: 1px solid rgba(99,72,220,0.3);
          border-radius: 20px; padding: 4px 13px; letter-spacing: 0.3px;
        }

        .cue-main {
          flex: 1; display: flex; align-items: center;
          padding: 48px 40px; gap: 56px;
          position: relative; z-index: 10;
          max-width: 1100px; margin: 0 auto; width: 100%;
        }

        .left-panel {
          flex: 1; display: flex; flex-direction: column;
          padding-right: 56px;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          margin-bottom: 20px;
        }
        .dot-live {
          width: 7px; height: 7px; border-radius: 50%; background: #2DB48C;
          animation: pulseGreen 2s ease-in-out infinite;
        }
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.5); }
        }
        .eyebrow-text {
          font-size: 11px; font-weight: 500; color: #2DB48C;
          letter-spacing: 0.9px; text-transform: uppercase;
        }

        .cue-h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 48px; line-height: 1.1; font-weight: 400;
          color: #F0EDF8; margin-bottom: 8px; letter-spacing: -0.8px;
        }
        .cue-h1 em { color: #9B7FFF; font-style: italic; }

        .cue-subtitle {
          font-size: 15px; color: #6E6690; line-height: 1.7;
          margin-bottom: 36px; max-width: 380px; font-weight: 300;
        }

        .stats-row {
          display: flex; gap: 28px; margin-bottom: 36px;
          align-items: center;
        }
        .stat { display: flex; flex-direction: column; gap: 3px; }
        .stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 30px; color: #E8E4FF; font-weight: 400;
        }
        .stat-label {
          font-size: 11px; color: #4A4568; font-weight: 400;
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .stat-divider {
          width: 1px; height: 40px;
          background: rgba(255,255,255,0.07);
        }

        .pills-row { display: flex; flex-direction: column; gap: 10px; }
        .pill {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.2s, background 0.2s;
          cursor: default;
        }
        .pill:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(99,72,220,0.3);
        }
        .pill-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .pill-icon.purple { background: rgba(99,72,220,0.2); }
        .pill-icon.teal   { background: rgba(45,180,140,0.18); }
        .pill-icon.amber  { background: rgba(220,165,60,0.18); }
        .pill-text { flex: 1; }
        .pill-title  { font-size: 13px; font-weight: 500; color: #C8C2E8; }
        .pill-desc   { font-size: 11px; color: #4A4568; margin-top: 1px; }
        .pill-tag {
          font-size: 10px; font-weight: 600; letter-spacing: 0.4px;
          padding: 3px 9px; border-radius: 20px;
        }
        .pill-tag.purple { background: rgba(99,72,220,0.2); color: #9B7FFF; }
        .pill-tag.teal   { background: rgba(45,180,140,0.15); color: #2DB48C; }
        .pill-tag.amber  { background: rgba(220,165,60,0.15); color: #DCA53C; }

        .right-panel {
          width: 340px; flex-shrink: 0;
          display: flex; flex-direction: column;
        }

        .priya-card {
          display: flex; align-items: center; gap: 13px;
          padding: 14px 16px; border-radius: 14px;
          background: rgba(99,72,220,0.08);
          border: 1px solid rgba(99,72,220,0.22);
          margin-bottom: 24px;
        }
        .priya-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6348DC, #2DB48C);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Serif Display', serif; font-size: 18px; color: #fff;
          position: relative;
        }
        .priya-online-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 11px; height: 11px; border-radius: 50%;
          background: #2DB48C; border: 2px solid #0C0A1A;
        }
        .priya-name { font-size: 14px; font-weight: 600; color: #C8C2E8; }
        .priya-role { font-size: 11px; color: #5C5578; margin-top: 1px; }
        .priya-wave {
          font-size: 20px; margin-left: auto;
          animation: wave 2.5s ease-in-out infinite;
          transform-origin: 70% 70%; display: inline-block;
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-18deg); }
          75% { transform: rotate(18deg); }
        }

        .form-heading {
          font-size: 14px; font-weight: 600; color: #E8E4FF; margin-bottom: 3px;
        }
        .form-subheading {
          font-size: 12px; color: #4A4568; margin-bottom: 20px;
        }
        .form-group { margin-bottom: 14px; }
        .form-label {
          display: block; font-size: 10px; font-weight: 500;
          color: #5C5578; margin-bottom: 6px;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .form-input {
          width: 100%; padding: 11px 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-size: 13px; color: #E8E4FF;
          outline: none; transition: border-color 0.2s, background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .form-input::placeholder { color: #2E2B48; }
        .form-input:focus {
          border-color: rgba(99,72,220,0.5);
          background: rgba(99,72,220,0.05);
        }

        .mic-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 14px;
        }
        .mic-dot {
          width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0; transition: background 0.3s;
        }
        .mic-dot-pulse { animation: pulseGreen 2s ease-in-out infinite; }
        .mic-dot-pulse-amber { animation: pulseAmber 1s ease-in-out infinite; }
        @keyframes pulseAmber {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .mic-label { flex: 1; font-size: 11px; color: #5C5578; }
        .mic-btn {
          font-size: 11px; font-weight: 500; color: #9B7FFF;
          background: rgba(99,72,220,0.12);
          border: 1px solid rgba(99,72,220,0.25);
          border-radius: 7px; padding: 5px 11px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .mic-btn:hover { background: rgba(99,72,220,0.22); }

        .error-msg {
          font-size: 11px; color: #E24B4A;
          background: rgba(226,75,74,0.08);
          border: 1px solid rgba(226,75,74,0.2);
          border-radius: 8px; padding: 8px 12px;
          margin-bottom: 12px;
        }

        .cta-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #6348DC 0%, #8B6FFF 100%);
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 600; color: #fff;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.1px;
          position: relative; overflow: hidden;
        }
        .cta-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);
        }
        .cta-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cta-btn:active:not(:disabled) { transform: scale(0.98); }
        .cta-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .consent {
          font-size: 10px; color: #2E2B48; text-align: center;
          margin-top: 12px; line-height: 1.6;
        }

        @media (max-width: 800px) {
          .cue-main { flex-direction: column; padding: 32px 24px; gap: 40px; }
          .left-panel { padding-right: 0; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 36px; }
          .right-panel { width: 100%; }
          .cue-h1 { font-size: 36px; }
        }
      `}</style>

      <div className="cue-root">
        <div className="bg-grid" />
        <div className="bg-orb1" />
        <div className="bg-orb2" />

        {/* Header */}
        <header className="cue-header">
          <div className="logo-row">
            <div className="logo-mark">C</div>
            <span className="logo-name">Cuemath</span>
          </div>
          <span className="header-badge">Tutor Hiring</span>
        </header>

        {/* Main */}
        <main className="cue-main">

          {/* Left panel */}
          <div className="left-panel">
            <div className="eyebrow">
              <span className="dot-live" />
              <span className="eyebrow-text">Now interviewing</span>
            </div>

            <h1 className="cue-h1">
              Meet <em>Priya,</em><br />your AI interviewer
            </h1>
            <p className="cue-subtitle">
              An 8–10 minute voice conversation to understand your teaching style.
              Speak naturally — there are no trick questions.
            </p>

            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">~10</span>
                <span className="stat-label">minutes</span>
              </div>
             
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">5</span>
                <span className="stat-label">dimensions</span>
              </div>
            </div>

            <div className="pills-row">
              {[
                { icon: '🎙️', iconClass: 'purple', title: 'Voice-only interview', desc: 'No typing, no forms', tag: 'Live', tagClass: 'purple' },
                { icon: '📊', iconClass: 'teal',   title: 'Rubric-based scoring', desc: 'Reviewed by our team',  tag: 'Fair',  tagClass: 'teal'   },
                { icon: '🧠', iconClass: 'amber',  title: 'Teaching style focus', desc: 'Pedagogy, not trivia', tag: 'Smart', tagClass: 'amber'  },
              ].map(({ icon, iconClass, title, desc, tag, tagClass }) => (
                <div key={title} className="pill">
                  <div className={`pill-icon ${iconClass}`}>{icon}</div>
                  <div className="pill-text">
                    <div className="pill-title">{title}</div>
                    <div className="pill-desc">{desc}</div>
                  </div>
                  <span className={`pill-tag ${tagClass}`}>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel / form */}
          <div className="right-panel">
            <div className="priya-card">
              <div className="priya-avatar">
                P
                <span className="priya-online-dot" />
              </div>
              <div>
                <div className="priya-name">Priya</div>
                <div className="priya-role">AI Interviewer · Online now</div>
              </div>
              <span className="priya-wave">👋</span>
            </div>

            <div className="form-heading">Ready to begin?</div>
            <div className="form-subheading">Enter your details and test your mic</div>

            <form onSubmit={handleStart}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ravi Sharma"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ravi@example.com"
                />
              </div>

              {/* Mic row */}
              <div className="mic-row">
                <div
                  className={`mic-dot ${micStatus === 'ok' ? 'mic-dot-pulse' : micStatus === 'testing' ? 'mic-dot-pulse-amber' : ''}`}
                  style={{ background: micDotColor }}
                />
                <span className="mic-label">{micLabel}</span>
                {micStatus !== 'ok' && (
                  <button type="button" className="mic-btn" onClick={testMic}>
                    {micStatus === 'denied' ? 'Retry' : 'Test mic'}
                  </button>
                )}
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="cta-btn" disabled={!canSubmit}>
                {loading ? 'Starting interview...' : 'Begin interview with Priya →'}
              </button>
            </form>

            <p className="consent">
              By continuing you agree to your conversation being recorded for evaluation purposes.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}