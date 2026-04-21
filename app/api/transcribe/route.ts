import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    // Browser sends "audio/webm;codecs=opus" — Sarvam only accepts "audio/webm"
    // Strip everything after the semicolon
    const rawMime    = audioFile.type || 'audio/webm'
    const cleanMime  = rawMime.split(';')[0].trim()   // "audio/webm"

    const extension  = cleanMime.includes('wav')  ? 'wav'  :
                       cleanMime.includes('mp4')  ? 'mp4'  :
                       cleanMime.includes('ogg')  ? 'ogg'  :
                       cleanMime.includes('aac')  ? 'aac'  : 'webm'

    // Re-create the blob with the clean MIME type so Sarvam accepts it
    const audioBuffer = await audioFile.arrayBuffer()
    const cleanBlob   = new Blob([audioBuffer], { type: cleanMime })
    const cleanFile   = new File([cleanBlob], `recording.${extension}`, {
      type: cleanMime,
    })

    const sarvamForm = new FormData()
    sarvamForm.append('file', cleanFile, `recording.${extension}`)
    sarvamForm.append('model', 'saarika:v2.5')
    sarvamForm.append('language_code', 'en-IN')

    console.log(`[transcribe] Sending ${(audioFile.size / 1024).toFixed(1)}kb as ${cleanMime}`)

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method:  'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY! },
      body:    sarvamForm,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[transcribe] Sarvam error:', response.status, errText)
      return NextResponse.json(
        { error: `Sarvam error ${response.status}: ${errText}` },
        { status: 502 }
      )
    }

    const data       = await response.json()
    const transcript = (data.transcript ?? '').trim()

    console.log(`[transcribe] "${transcript.slice(0, 80)}"`)

    return NextResponse.json({ transcript })

  } catch (error) {
    console.error('[transcribe]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}