import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method:  'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY!,
        'Content-Type':         'application/json',
      },
      body: JSON.stringify({
        inputs:               [text],
        target_language_code: 'en-IN',
        speaker:              'anushka',       // warm, professional female
        model:                'bulbul:v2',
        pace:                 1.0,
        pitch:                0,
        loudness:             1.5,
        speech_sample_rate:   22050,
        enable_preprocessing: true,
      }),
    })

    if (!response.ok) {
      console.error('[speak] Sarvam error:', await response.text())
      return NextResponse.json({ error: 'TTS failed' }, { status: 502 })
    }

    const data        = await response.json()
    const audioBase64 = data.audios?.[0]

    if (!audioBase64) {
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 })
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')

    return new NextResponse(audioBuffer, {
      status:  200,
      headers: {
        'Content-Type':   'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control':  'no-store',
      },
    })
  } catch (error) {
    console.error('[speak]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}