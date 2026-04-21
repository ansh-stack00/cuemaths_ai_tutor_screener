'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMicrophone }        from '@/hooks/useMicrophone'
import { useWaveform }          from '@/hooks/useWaveform'
import { useAudioPlayer }       from '@/hooks/useAudioPlayer'
import { useInterviewMachine }  from '@/hooks/useInterviewMachine'
import { useSilenceDetection }  from '@/hooks/useSilenceDetection'

const SILENCE_THRESHOLD_MS = 3000
const MAX_RECORDING_MS     = 20000
const MIN_SPEECH_MS        = 800
const AUTO_START_DELAY_MS  = 800

const WELCOME_TEXT =
  "Hi there! I'm Priya from Cuemath. It's really nice to meet you. " +
  "Before we get started, could you tell me a little bit about yourself " +
  "and your experience with teaching?"

// ── Global styles ─────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

  .ai-root {
    font-family: 'DM Sans', sans-serif;
    background: #0C0A1A;
    min-height: 100vh;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    color: #E8E4FF;
  }
  .ai-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }
  .ai-orb1 {
    position: fixed; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,72,220,0.28) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none; z-index: 0;
  }
  .ai-orb2 {
    position: fixed; width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,180,140,0.15) 0%, transparent 70%);
    bottom: -80px; left: -80px; pointer-events: none; z-index: 0;
  }

  /* Header */
  .ai-header {
    position: relative; z-index: 10; flex-shrink: 0;
    padding: 18px 36px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .ai-logo-row { display: flex; align-items: center; gap: 10px; }
  .ai-logo-mark {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #6348DC 0%, #9B7FFF 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 15px; color: #fff;
  }
  .ai-logo-name { font-size: 14px; font-weight: 600; color: #E8E4FF; letter-spacing: -0.2px; }
  .ai-header-right { display: flex; align-items: center; gap: 12px; }
  .ai-timer {
    font-size: 13px; font-weight: 500; color: #3D3860;
    font-variant-numeric: tabular-nums; letter-spacing: 0.5px;
  }
  .ai-progress-pill {
    font-size: 11px; font-weight: 500; color: #9B7FFF;
    background: rgba(99,72,220,0.15); border: 1px solid rgba(99,72,220,0.3);
    border-radius: 20px; padding: 4px 12px;
  }

  /* Progress bar */
  .ai-progress-bar-wrap {
    height: 2px; background: rgba(255,255,255,0.04);
    position: relative; z-index: 10;
  }
  .ai-progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6348DC, #9B7FFF);
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  /* Main */
  .ai-main {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px; gap: 16px;
    position: relative; z-index: 10;
  }
  .ai-content { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 14px; }

  /* Priya card */
  .ai-priya-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; padding: 32px 28px;
    display: flex; flex-direction: column; align-items: center;
  }

  /* Avatar */
  .ai-avatar-wrap { position: relative; margin-bottom: 18px; }
  .ai-avatar {
    width: 88px; height: 88px; border-radius: 50%;
    background: linear-gradient(135deg, #6348DC, #9B7FFF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 34px; color: #fff;
    position: relative; z-index: 1;
  }
  .ai-avatar-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid transparent;
    transition: border-color 0.4s, box-shadow 0.4s;
  }
  .ai-avatar-ring.speaking {
    border-color: rgba(99,72,220,0.5);
    box-shadow: 0 0 0 4px rgba(99,72,220,0.12), 0 0 20px rgba(99,72,220,0.2);
    animation: aiRingPulse 1.8s ease-in-out infinite;
  }
  .ai-avatar-ring.listening {
    border-color: rgba(45,180,140,0.5);
    box-shadow: 0 0 0 4px rgba(45,180,140,0.1), 0 0 20px rgba(45,180,140,0.18);
    animation: aiRingPulse 1.2s ease-in-out infinite;
  }
  @keyframes aiRingPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.04); }
  }

  .ai-name {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; font-weight: 400; color: #E8E4FF;
    margin-bottom: 10px;
  }

  /* Status badge */
  .ai-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
    margin-bottom: 24px;
  }
  .ai-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    flex-shrink: 0;
  }

  /* Badge variants */
  .ai-badge.starting    { background: rgba(255,255,255,0.05); color: #4A4568; border: 1px solid rgba(255,255,255,0.07); }
  .ai-badge.starting .ai-badge-dot { background: #3D3860; }

  .ai-badge.priya_speaking, .ai-badge.priya_generating {
    background: rgba(99,72,220,0.15); color: #9B7FFF; border: 1px solid rgba(99,72,220,0.3);
  }
  .ai-badge.priya_speaking .ai-badge-dot,
  .ai-badge.priya_generating .ai-badge-dot { background: #9B7FFF; animation: aiDotPulse 1.2s ease-in-out infinite; }

  .ai-badge.listening   { background: rgba(45,180,140,0.12); color: #2DB48C; border: 1px solid rgba(45,180,140,0.3); }
  .ai-badge.listening .ai-badge-dot { background: #2DB48C; animation: aiDotPulse 0.8s ease-in-out infinite; }

  .ai-badge.waiting     { background: rgba(45,180,140,0.08); color: #1D9E75; border: 1px solid rgba(45,180,140,0.2); }
  .ai-badge.waiting .ai-badge-dot { background: #1D9E75; }

  .ai-badge.transcribing { background: rgba(220,165,60,0.12); color: #DCA53C; border: 1px solid rgba(220,165,60,0.3); }
  .ai-badge.transcribing .ai-badge-dot { background: #DCA53C; animation: aiDotPulse 1s ease-in-out infinite; }

  .ai-badge.reviewing, .ai-badge.thinking {
    background: rgba(99,72,220,0.12); color: #9B7FFF; border: 1px solid rgba(99,72,220,0.25);
  }
  .ai-badge.reviewing .ai-badge-dot,
  .ai-badge.thinking .ai-badge-dot { background: #7F77DD; animation: aiDotPulse 0.9s ease-in-out infinite; }

  .ai-badge.complete    { background: rgba(45,180,140,0.12); color: #2DB48C; border: 1px solid rgba(45,180,140,0.3); }
  .ai-badge.complete .ai-badge-dot { background: #2DB48C; }

  .ai-badge.error       { background: rgba(226,75,74,0.1); color: #F09595; border: 1px solid rgba(226,75,74,0.25); }
  .ai-badge.error .ai-badge-dot { background: #E24B4A; }

  @keyframes aiDotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(1.5); }
  }

  /* Waveform */
  .ai-waveform {
    display: flex; align-items: center; justify-content: center;
    gap: 3px; height: 44px; width: 100%; margin-bottom: 16px;
  }
  .ai-bar { width: 3px; border-radius: 2px; min-height: 4px; transition: height 0.07s ease, background 0.3s; }

  /* Thinking dots */
  .ai-thinking { display: flex; gap: 5px; align-items: center; justify-content: center; height: 24px; margin-bottom: 8px; }
  .ai-think-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #6348DC;
    animation: aiThinkBounce 1.2s ease-in-out infinite;
  }
  .ai-think-dot:nth-child(2) { animation-delay: 0.2s; }
  .ai-think-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes aiThinkBounce {
    0%, 100% { transform: translateY(0); opacity: 0.35; }
    50%       { transform: translateY(-7px); opacity: 1; }
  }

  /* Silence ring */
  .ai-silence-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ai-silence-label { font-size: 11px; color: #3D3860; }

  /* Error box */
  .ai-error {
    padding: 12px 16px; border-radius: 12px; text-align: center;
    background: rgba(226,75,74,0.07); border: 1px solid rgba(226,75,74,0.2);
    margin-top: 8px;
  }
  .ai-error-title { font-size: 13px; color: #F09595; margin-bottom: 2px; }
  .ai-error-sub   { font-size: 11px; color: #7A3535; }

  /* Hint */
  .ai-hint { font-size: 12px; color: #2E2B48; text-align: center; }
  .ai-hint-inline {
    font-size: 12px; color: #3D3860; text-align: center; margin-top: 6px;
  }

  /* Transcript */
  .ai-transcript-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px; overflow: hidden;
  }
  .ai-transcript-toggle {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; background: none; border: none;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: background 0.2s;
  }
  .ai-transcript-toggle:hover { background: rgba(255,255,255,0.03); }
  .ai-transcript-label {
    font-size: 10px; font-weight: 500; color: #3D3860;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .ai-transcript-chevron {
    width: 15px; height: 15px; color: #2E2B48;
    transition: transform 0.2s;
  }
  .ai-transcript-chevron.open { transform: rotate(180deg); }
  .ai-transcript-body {
    border-top: 1px solid rgba(255,255,255,0.05);
    padding: 14px 18px 18px;
    max-height: 240px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(99,72,220,0.3) transparent;
  }
  .ai-transcript-body::-webkit-scrollbar { width: 3px; }
  .ai-transcript-body::-webkit-scrollbar-track { background: transparent; }
  .ai-transcript-body::-webkit-scrollbar-thumb { background: rgba(99,72,220,0.3); border-radius: 3px; }
  .ai-msg { display: flex; gap: 8px; }
  .ai-msg.candidate { flex-direction: row-reverse; }
  .ai-msg-avatar {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600;
  }
  .ai-msg-avatar.interviewer { background: rgba(99,72,220,0.3); color: #9B7FFF; }
  .ai-msg-avatar.candidate   { background: rgba(45,180,140,0.2); color: #2DB48C; }
  .ai-msg-bubble {
    max-width: 78%; padding: 9px 13px; border-radius: 13px;
    font-size: 12px; line-height: 1.6; color: #C8C2E8;
  }
  .ai-msg-bubble.interviewer {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-top-left-radius: 3px;
  }
  .ai-msg-bubble.candidate {
    background: rgba(99,72,220,0.12); border: 1px solid rgba(99,72,220,0.2);
    border-top-right-radius: 3px;
  }

  /* MicGate */
  .ai-gate-wrap {
    min-height: 100vh; background: #0C0A1A;
    display: flex; align-items: center; justify-content: center;
    padding: 24px; font-family: 'DM Sans', sans-serif; position: relative;
  }
  .ai-gate-card {
    width: 100%; max-width: 360px;
    background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; padding: 36px 32px; text-align: center;
  }
  .ai-gate-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(99,72,220,0.12); border: 1px solid rgba(99,72,220,0.28);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px;
  }
  .ai-gate-title {
    font-family: 'DM Serif Display', serif; font-size: 24px; font-weight: 400;
    color: #E8E4FF; margin-bottom: 10px;
  }
  .ai-gate-desc { font-size: 13px; color: #4A4568; line-height: 1.65; margin-bottom: 28px; font-weight: 300; }
  .ai-gate-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #6348DC, #8B6FFF);
    font-size: 14px; font-weight: 600; color: #fff; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: opacity 0.2s, transform 0.15s;
  }
  .ai-gate-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .ai-gate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ai-gate-denied {
    padding: 12px 14px; border-radius: 11px; margin-bottom: 14px;
    background: rgba(226,75,74,0.08); border: 1px solid rgba(226,75,74,0.2);
    font-size: 12px; color: #F09595; line-height: 1.55;
  }
  .ai-gate-refresh {
    width: 100%; padding: 13px; border-radius: 11px; cursor: pointer;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    font-size: 13px; font-weight: 500; color: #C8C2E8;
    font-family: 'DM Sans', sans-serif; transition: background 0.2s;
  }
  .ai-gate-refresh:hover { background: rgba(255,255,255,0.08); }

  /* Tab warning */
  .ai-tab-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 24px; backdrop-filter: blur(4px);
  }
  .ai-tab-card {
    background: #161228; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 28px 24px;
    max-width: 300px; width: 100%; text-align: center;
  }
  .ai-tab-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(220,165,60,0.14); border: 1px solid rgba(220,165,60,0.3);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .ai-tab-title { font-size: 15px; font-weight: 600; color: #E8E4FF; margin-bottom: 6px; }
  .ai-tab-desc  { font-size: 13px; color: #4A4568; }

  @media (max-width: 500px) {
    .ai-header { padding: 16px 20px; }
    .ai-main { padding: 28px 16px; }
    .ai-avatar { width: 72px; height: 72px; font-size: 28px; }
  }
`

// ── Badge config ──────────────────────────────────────────
const BADGE_LABELS: Record<string, string> = {
  starting:         'Starting interview…',
  priya_speaking:   'Priya is speaking',
  priya_generating: 'Generating response…',
  listening:        'Listening…',
  waiting:          'Your turn to speak',
  transcribing:     'Processing your response…',
  reviewing:        'Reviewing your answer…',
  thinking:         'Priya is thinking…',
  complete:         'Interview complete',
  error:            'Something went wrong',
}

type BadgeKey = keyof typeof BADGE_LABELS

// ── MicGate ───────────────────────────────────────────────
function MicGate({ onGranted }: { onGranted: () => void }) {
  const [checking, setChecking] = useState(false)
  const [denied,   setDenied]   = useState(false)

  async function requestMic() {
    setChecking(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      onGranted()
    } catch {
      setDenied(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="ai-gate-wrap">
        <div className="ai-bg-grid" />
        <div className="ai-orb1" />
        <div className="ai-gate-card">
          <div className="ai-gate-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#9B7FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="ai-gate-title">Allow microphone</h2>
          <p className="ai-gate-desc">
            This is a voice interview. Priya will speak and listen automatically — no buttons needed.
          </p>
          {denied ? (
            <div>
              <div className="ai-gate-denied">
                Microphone access was denied. Please allow it in your browser settings and refresh.
              </div>
              <button className="ai-gate-refresh" onClick={() => window.location.reload()}>
                Refresh page
              </button>
            </div>
          ) : (
            <button className="ai-gate-btn" onClick={requestMic} disabled={checking}>
              {checking ? 'Checking…' : 'Allow microphone & begin'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Silence countdown ring ────────────────────────────────
function SilenceCountdown({ progress }: { progress: number }) {
  if (progress <= 0) return null
  const size   = 40
  const radius = 15
  const circ   = 2 * Math.PI * radius
  const offset = circ * (1 - progress)
  const secsLeft = Math.ceil((1 - progress) * (SILENCE_THRESHOLD_MS / 1000))

  return (
    <div className="ai-silence-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
                  fill="none" stroke="rgba(45,180,140,0.15)" strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={radius}
                  fill="none" stroke="#2DB48C" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#2DB48C' }}>{secsLeft}</span>
        </div>
      </div>
      <span className="ai-silence-label">auto-send</span>
    </div>
  )
}

// ── Tab switch warning ────────────────────────────────────
function TabSwitchWarning() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const h = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])
  if (!hidden) return null
  return (
    <div className="ai-tab-overlay">
      <div className="ai-tab-card">
        <div className="ai-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="#DCA53C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="ai-tab-title">Please return to this tab</p>
        <p className="ai-tab-desc">Your interview is still in progress.</p>
      </div>
    </div>
  )
}

// ── Transcript panel ──────────────────────────────────────
function TranscriptPanel({
  messages,
}: {
  messages: Array<{ role: 'interviewer' | 'candidate'; content: string }>
}) {
  const [open, setOpen] = useState(false)
  const scrollRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  return (
    <div className="ai-transcript-card">
      <button className="ai-transcript-toggle" onClick={() => setOpen(o => !o)}>
        <span className="ai-transcript-label">Transcript · {messages.length} messages</span>
        <svg className={`ai-transcript-chevron ${open ? 'open' : ''}`}
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="ai-transcript-body" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              <div className={`ai-msg-avatar ${msg.role}`}>
                {msg.role === 'interviewer' ? 'P' : 'Y'}
              </div>
              <div className={`ai-msg-bubble ${msg.role}`}>{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main interview content ────────────────────────────────
function InterviewContent() {
  const router    = useRouter()
  const params    = useSearchParams()
  const sessionId = params.get('session') ?? ''

  const [micGranted, setMicGranted] = useState(false)
  const [badgeKey,   setBadgeKey]   = useState<BadgeKey>('starting')
  const [silencePct, setSilencePct] = useState(0)
  const [tick,       setTick]       = useState(0)

  const { state, dispatch, messagesRef, addMessage, setComplete } = useInterviewMachine()
  const { micState, startRecording, stopRecording }               = useMicrophone()
  const { barHeights, attachStream, detach }                       = useWaveform()

  const { start: startSilence, stop: stopSilence, getSilenceProgress } = useSilenceDetection()

  const isProcessingRef = useRef(false)
  const hasStartedRef   = useRef(false)
  const startTimeRef    = useRef<number>(0)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const silenceRafRef   = useRef<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const startSilenceTracking = useCallback(() => {
    const update = () => {
      setSilencePct(getSilenceProgress(SILENCE_THRESHOLD_MS))
      silenceRafRef.current = requestAnimationFrame(update)
    }
    silenceRafRef.current = requestAnimationFrame(update)
  }, [getSilenceProgress])

  const stopSilenceTracking = useCallback(() => {
    if (silenceRafRef.current) { cancelAnimationFrame(silenceRafRef.current); silenceRafRef.current = null }
    setSilencePct(0)
  }, [])

  useEffect(() => {
    if (micState === 'recording' && activeStreamRef.current) attachStream(activeStreamRef.current)
    else if (micState !== 'recording') detach()
  }, [micState, attachStream, detach])

  const autoSubmitRef          = useRef<() => Promise<void>>(async () => {})
  const autoStartRecordingRef  = useRef<() => Promise<void>>(async () => {})

  const onPlaybackEnd = useCallback(() => {
    if (!state.isComplete) {
      setTimeout(() => {
        dispatch({ type: 'BEGIN_RECORDING' })
        setBadgeKey('waiting')
        autoStartRecordingRef.current()
      }, AUTO_START_DELAY_MS)
    }
  }, [state.isComplete, dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  const { playerState, playTTS } = useAudioPlayer({ onPlaybackEnd })

  useEffect(() => {
    if (!micGranted || !sessionId || hasStartedRef.current) return
    hasStartedRef.current = true
    async function startInterview() {
      startTimeRef.current = Date.now()
      dispatch({ type: 'START', startTime: startTimeRef.current })
      setBadgeKey('priya_generating')
      addMessage({ role: 'interviewer', content: WELCOME_TEXT })
      try {
        setBadgeKey('priya_speaking')
        await playTTS(WELCOME_TEXT)
      } catch {
        dispatch({ type: 'SET_ERROR', message: 'Failed to start. Please refresh.' })
        setBadgeKey('error')
      }
    }
    startInterview()
  }, [micGranted, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const autoStartRecording = useCallback(async () => {
    if (isProcessingRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      activeStreamRef.current = stream
      attachStream(stream)
      startSilence(stream, {
        onSilence:          () => autoSubmitRef.current(),
        silenceThresholdMs: SILENCE_THRESHOLD_MS,
        maxRecordingMs:     MAX_RECORDING_MS,
        minSpeechMs:        MIN_SPEECH_MS,
        amplitudeThreshold: 30,
      })
      startSilenceTracking()
      setBadgeKey('listening')
      await startRecording()
    } catch (err) {
      console.error('[interview] autoStartRecording failed:', err)
      dispatch({ type: 'SET_ERROR', message: 'Could not access microphone.' })
      setBadgeKey('error')
    }
  }, [attachStream, startSilence, startSilenceTracking, startRecording, dispatch])

  useEffect(() => { autoStartRecordingRef.current = autoStartRecording }, [autoStartRecording])

  const autoSubmit = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    stopSilenceTracking(); stopSilence(); detach()
    activeStreamRef.current?.getTracks().forEach(t => t.stop())
    activeStreamRef.current = null

    try {
      const blob = await stopRecording()
      if (!blob) {
        dispatch({ type: 'SET_ERROR', message: 'No audio captured.' })
        setBadgeKey('error')
        setTimeout(() => { dispatch({ type: 'RESET_TO_USER_TURN' }); setBadgeKey('waiting'); autoStartRecordingRef.current() }, 2000)
        return
      }

      setBadgeKey('transcribing'); dispatch({ type: 'BEGIN_TRANSCRIBING' })
      let transcript = ''
      try {
        const form = new FormData(); form.append('audio', blob, 'recording.webm')
        const res  = await fetch('/api/transcribe', { method: 'POST', body: form })
        transcript = (await res.json()).transcript?.trim() ?? ''
      } catch {
        dispatch({ type: 'SET_ERROR', message: 'Transcription failed.' }); setBadgeKey('error')
        setTimeout(() => { dispatch({ type: 'RESET_TO_USER_TURN' }); setBadgeKey('waiting'); autoStartRecordingRef.current() }, 2000)
        return
      }

      if (!transcript) {
        dispatch({ type: 'RESET_TO_USER_TURN' }); setBadgeKey('waiting'); autoStartRecordingRef.current(); return
      }

      addMessage({ role: 'candidate', content: transcript })
      setBadgeKey('reviewing'); dispatch({ type: 'BEGIN_THINKING' })
      let reply = '', isComplete = false

      try {
        const res  = await fetch('/api/respond', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body:   JSON.stringify({ sessionId, messages: messagesRef.current.slice(0, -1), newMessage: transcript }),
        })
        const data = await res.json(); reply = data.reply ?? ''; isComplete = data.isComplete ?? false
      } catch {
        dispatch({ type: 'SET_ERROR', message: 'Connection error.' }); setBadgeKey('error')
        setTimeout(() => { dispatch({ type: 'RESET_TO_USER_TURN' }); setBadgeKey('waiting'); autoStartRecordingRef.current() }, 2000)
        return
      }

      if (!reply) { dispatch({ type: 'RESET_TO_USER_TURN' }); setBadgeKey('waiting'); autoStartRecordingRef.current(); return }

      addMessage({ role: 'interviewer', content: reply })
      if (isComplete) setComplete()
      setBadgeKey('priya_generating'); dispatch({ type: 'BEGIN_SPEAKING' })

      try {
        setBadgeKey('priya_speaking'); await playTTS(reply)
      } catch {
        dispatch({ type: 'SET_ERROR', message: 'Audio playback failed.' }); setBadgeKey('error')
        setTimeout(() => { setBadgeKey('waiting'); autoStartRecordingRef.current() }, 2000)
        return
      }

      if (isComplete) await handleAssessAndRedirect()
    } finally {
      isProcessingRef.current = false
    }
  }, [sessionId, stopRecording, addMessage, setComplete, dispatch, messagesRef, stopSilence, stopSilenceTracking, detach, playTTS])

  useEffect(() => { autoSubmitRef.current = autoSubmit }, [autoSubmit])

  async function handleAssessAndRedirect() {
    try {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
      const messageSnapshot = [...messagesRef.current]
      if (!messageSnapshot.length) return
      await fetch('/api/assess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ sessionId, messages: messageSnapshot, durationSeconds }),
      })
    } catch (err) { console.error('[interview] assess failed:', err) }
    finally { router.push(`/complete?session=${sessionId}`) }
  }

  // ── Derived ───────────────────────────────────────────
  void tick
  const elapsedSecs    = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0
  const elapsedLabel   = `${Math.floor(elapsedSecs / 60)}:${String(elapsedSecs % 60).padStart(2, '0')}`
  const candidateTurns = state.messages.filter(m => m.role === 'candidate').length
  const progressPct    = Math.min(100, (candidateTurns / 5) * 100)
  const isListening    = badgeKey === 'listening'
  const isSpeaking     = badgeKey === 'priya_speaking'
  const isThinking     = badgeKey === 'reviewing' || badgeKey === 'thinking'

  if (!sessionId) return (
    <div style={{ minHeight: '100vh', background: '#0C0A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#4A4568', marginBottom: 12 }}>No session found.</p>
        <a href="/welcome" style={{ fontSize: 13, color: '#9B7FFF' }}>← Back to start</a>
      </div>
    </div>
  )

  if (!micGranted) return <MicGate onGranted={() => setMicGranted(true)} />

  return (
    <>
      <style>{globalStyles}</style>
      <div className="ai-root">
        <div className="ai-bg-grid" />
        <div className="ai-orb1" />
        <div className="ai-orb2" />

        {/* Header */}
        <header className="ai-header">
          <div className="ai-logo-row">
            <div className="ai-logo-mark">C</div>
            <span className="ai-logo-name">Cuemath</span>
          </div>
          <div className="ai-header-right">
            {startTimeRef.current > 0 && <span className="ai-timer">{elapsedLabel}</span>}
            {candidateTurns > 0 && (
              <span className="ai-progress-pill">{candidateTurns} / 5</span>
            )}
          </div>
        </header>

        {/* Progress bar */}
        {candidateTurns > 0 && (
          <div className="ai-progress-bar-wrap">
            <div className="ai-progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {/* Main */}
        <main className="ai-main">
          <div className="ai-content">

            {/* Priya card */}
            <div className="ai-priya-card">

              {/* Avatar with ring */}
              <div className="ai-avatar-wrap">
                <div className="ai-avatar">P</div>
                <div className={`ai-avatar-ring ${isSpeaking ? 'speaking' : isListening ? 'listening' : ''}`} />
              </div>

              <p className="ai-name">Priya</p>

              {/* Status badge */}
              <div className={`ai-badge ${badgeKey}`}>
                <span className="ai-badge-dot" />
                {BADGE_LABELS[badgeKey] ?? badgeKey}
              </div>

              {/* Waveform */}
              <div className="ai-waveform">
                {barHeights.map((h, i) => (
                  <div
                    key={i}
                    className="ai-bar"
                    style={{
                      height:     `${Math.max(4, h * 44)}px`,
                      background: isListening
                        ? `hsl(${152 + i * 5}, 55%, ${38 + h * 28}%)`
                        : isSpeaking
                        ? `hsl(${262 + i * 7}, 60%, ${42 + h * 26}%)`
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>

              {/* Thinking dots */}
              {isThinking && (
                <div className="ai-thinking">
                  <div className="ai-think-dot" />
                  <div className="ai-think-dot" />
                  <div className="ai-think-dot" />
                </div>
              )}

              {/* Silence countdown */}
              {isListening && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <SilenceCountdown progress={silencePct} />
                  <p className="ai-hint-inline">Speak when ready · auto-submits after you pause</p>
                </div>
              )}

              {/* Error */}
              {state.errorMessage && (
                <div className="ai-error">
                  <p className="ai-error-title">{state.errorMessage}</p>
                  <p className="ai-error-sub">Auto-retrying…</p>
                </div>
              )}
            </div>

            {/* Progress hint */}
            {candidateTurns > 0 && candidateTurns < 5 && (
              <p className="ai-hint">Question {candidateTurns} of ~5 complete</p>
            )}

            {/* Transcript */}
            {state.messages.length > 0 && (
              <TranscriptPanel messages={state.messages} />
            )}
          </div>
        </main>

        <TabSwitchWarning />
      </div>
    </>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#0C0A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2px solid rgba(99,72,220,0.2)', borderTopColor: '#6348DC',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    }>
      <InterviewContent />
    </Suspense>
  )
}