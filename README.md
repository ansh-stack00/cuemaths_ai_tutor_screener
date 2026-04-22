# Cuemath AI Tutor Screener

> AI-powered voice interview system that screens tutor candidates through a natural conversation and generates a structured hiring rubric.

**Live demo:** https://cuemaths-ai-tutor-screener.vercel.app  
**Admin dashboard:** https://cuemaths-ai-tutor-screener.vercel.app/admin

---

## What it does

A candidate visits the app, enters their name and email, allows microphone access, and has a fully automated 8–10 minute voice conversation with **Priya** — a warm AI interviewer built on Claude. No buttons, no typing. Just a conversation.

After the interview, the hiring team sees:
- Five scored dimensions with direct quotes as evidence
- Red flags and standout moments
- An overall recommendation — **Advance**, **Hold**, or **Reject**

---

## Demo

| Candidate flow | Admin rubric |
|---|---|
| Welcome → mic test → interview starts automatically | Session list with scores and recommendations |
| Priya asks questions, listens, follows up | Dimension breakdown with quoted evidence |
| Silence detection auto-submits responses | Full transcript with bubble layout |
| Redirects to completion page | Red flags and standout moments |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| STT | Sarvam AI — Saarika v2.5 (Indian English optimised) |
| TTS | Sarvam AI — Bulbul v2 · Speaker: Priya |
| LLM | Anthropic Claude claude-opus-4-5 |
| Deployment | Vercel |

---

## Why Sarvam AI

Cuemath's tutor candidates are predominantly Indian, speaking Indian English with regional accents and occasional Hindi code-switching. Sarvam's Saarika model is trained specifically on this demographic.

Whisper handles general English well but struggles with Indian accents at scale. This was a product decision, not just a technical one — the system needs to work for the actual user.

---

## Architecture

```
Browser (Next.js)
    │
    ├── /welcome          Candidate entry — name, email, mic test
    ├── /interview        Fully automatic voice interview
    ├── /complete         Post-interview confirmation
    └── /admin            Hiring team dashboard
         └── /admin/[id]  Full rubric for one session

API Routes (server-side, keys never exposed to client)
    │
    ├── /api/session/create   Creates Supabase session
    ├── /api/transcribe       Audio blob → Sarvam Saarika → text
    ├── /api/respond          Transcript → Claude → Priya's reply
    ├── /api/speak            Text → Sarvam Bulbul → WAV audio
    └── /api/assess           Full transcript → Claude → rubric JSON

Supabase
    ├── sessions      One row per interview attempt
    ├── messages      Full transcript, one row per turn
    └── assessments   Rubric JSON, one row per completed session
```

---

## How the automatic turn-taking works

No record button. The system uses the Web Audio API's `AnalyserNode` to measure RMS amplitude in real time.

```
Priya finishes speaking
    ↓ 800ms natural pause
Mic opens automatically → badge: "Listening..."
Candidate speaks → waveform turns green
    ↓ candidate pauses for 3 seconds
Silence detected → auto-submit
    ↓
"Processing your response..."
"AI is reviewing your answer..."
"Priya is speaking..." 
    ↓ repeat
```

The silence detector accumulates speech in segments rather than measuring time-since-first-speech. This correctly handles natural pauses mid-sentence without premature submission.

---

## Database schema

```sql
-- One row per interview
sessions (
  id uuid, candidate_name text, candidate_email text,
  started_at timestamptz, completed_at timestamptz,
  status text, duration_seconds int
)

-- Full transcript
messages (
  id uuid, session_id uuid, role text,  -- 'interviewer' | 'candidate'
  content text, created_at timestamptz
)

-- Rubric JSON
assessments (
  id uuid, session_id uuid,
  rubric jsonb, overall_recommendation text, overall_score numeric
)
```

---

## Rubric dimensions

Claude evaluates the candidate across five dimensions, each scored 1–5 with direct quotes as evidence:

| Dimension | What it measures |
|---|---|
| Communication clarity | Structured, easy to follow explanations |
| Warmth & patience | Genuine care for the student's emotional state |
| Ability to simplify | Making concepts accessible to a 9-year-old |
| English fluency | Comfort and naturalness for teaching |
| Adaptability | Real listening vs scripted answers |

Overall recommendation thresholds: **Advance** ≥ 3.5 · **Hold** 2.5–3.4 · **Reject** < 2.5

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/cuemath-tutor-screener
cd cuemath-tutor-screener
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your project URL and keys from **Settings → API**

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ANTHROPIC_API_KEY=sk-ant-your-key
SARVAM_API_KEY=your-sarvam-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Verify setup

- `/welcome` — form loads with mic test
- `/admin` — shows "No interviews yet" (Supabase connected)
- Run a test interview end to end
- Check `/admin` for the completed session with rubric

---

## Project structure

```
cuemath-tutor-screener/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                    → redirects to /welcome
│   ├── welcome/page.tsx            → candidate entry
│   ├── interview/page.tsx          → voice interview UI
│   ├── complete/page.tsx           → post-interview confirmation
│   ├── admin/
│   │   ├── page.tsx                → session list
│   │   ├── loading.tsx             → skeleton loader
│   │   └── [id]/
│   │       ├── page.tsx            → full rubric view
│   │       └── not-found.tsx       → 404 for bad IDs
│   └── api/
│       ├── session/create/         → POST create session
│       ├── transcribe/             → POST audio → text
│       ├── respond/                → POST text → Claude reply
│       ├── speak/                  → POST text → audio
│       └── assess/                 → POST transcript → rubric
├── components/
│   └── admin/
│       ├── DimensionBar.tsx        → score bar + evidence quotes
│       ├── RecommendationBadge.tsx → Advance / Hold / Reject badge
│       └── ScoreRing.tsx           → circular score visualization
├── hooks/
│   ├── useMicrophone.ts            → MediaRecorder wrapper
│   ├── useWaveform.ts              → AudioContext frequency visualizer
│   ├── useAudioPlayer.ts           → WAV blob playback
│   ├── useInterviewMachine.ts      → useReducer state machine
│   └── useSilenceDetection.ts      → RMS amplitude + auto-submit
├── lib/
│   ├── supabase/
│   │   ├── client.ts               → browser client
│   │   ├── server.ts               → service role client (API routes only)
│   │   └── helpers.ts              → DB helper functions
│   ├── claude/
│   │   └── prompts.ts              → system prompt + assessment prompt
│   └── utils.ts                    → formatting helpers
├── types/
│   └── index.ts                    → all TypeScript types
└── supabase/
    └── schema.sql                  → run this in Supabase SQL Editor
```

---

## Key engineering decisions

**Silence detection over push-to-talk**  
Original design had a record button. Replaced with RMS amplitude monitoring via `AnalyserNode`. Fires after 3 seconds of silence following at least 0.8 seconds of accumulated speech. Makes the experience feel like a real phone call.

**Accumulated speech segments**  
First version measured time-since-first-speech, which kept growing during silence and broke the detector. Replaced with per-segment accumulation — each speaking burst is measured and summed. Only fires when both silence duration AND total speech time exceed thresholds.

**Claude owns all intelligence, Sarvam owns only voice**  
Sarvam converts audio to text and text to audio. Everything smart — follow-up questions, handling "I don't know", detecting completion, generating rubrics — lives in Claude's system prompt and conversation history. Clean separation means each can be tuned independently.

**Forward refs to solve circular dependency**  
`autoSubmit` and `autoStartRecording` call each other. Stored both in refs (`autoSubmitRef`, `autoStartRecordingRef`) kept current via `useEffect`. Avoids stale closure issues in the async voice loop.

**Rubric with quoted evidence**  
Pass/fail isn't useful to a hiring team. Assessment prompt instructs Claude to extract direct quotes from the transcript as evidence for each dimension score. Hiring managers can read the actual words the candidate used, not just a number.

---

## Security

- All API keys are server-side only via Next.js API routes
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` and `SARVAM_API_KEY` are never prefixed with `NEXT_PUBLIC_`
- Row Level Security enabled on all Supabase tables
- `.env.local` is in `.gitignore` and never committed

---

## What I'd build next

- **Streaming TTS** — cut the 1.5s latency gap between turns using Sarvam's streaming endpoint
- **Audio replay in admin** — store and replay candidate audio alongside the transcript so tone and confidence are audible, not just readable
- **Candidate email confirmation** — send reference ID and next steps after interview completes
- **Multi-language support** — Sarvam supports Hindi, Tamil, Telugu; useful for Cuemath's regional markets
- **Dashboard filters** — filter by recommendation, score range, date for the hiring team
- **Question bank rotation** — randomise questions across a larger bank to prevent candidates sharing exact questions

---

## Built with

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Sarvam AI](https://sarvam.ai)
- [Anthropic Claude](https://anthropic.com)
- [Tailwind CSS](https://tailwindcss.com)