import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { loadHotelConfig } from '@/lib/knowledge-base/loader'
import { toHotelKnowledge } from '@/lib/knowledge-base/mapper'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { postProcess } from '@/lib/post-processor'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  let hotelId: string, message: string, history: ChatMessage[]
  try {
    ;({ hotelId, message, history } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!hotelId || !message) {
    return NextResponse.json({ error: 'Missing hotelId or message' }, { status: 400 })
  }

  let hotelConfig
  try {
    hotelConfig = loadHotelConfig(hotelId)
  } catch {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  const hotel = toHotelKnowledge(hotelConfig)
  const systemPrompt = buildSystemPrompt(hotel)

  const messages = [
    ...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ]

  let rawText: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })
    rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] Anthropic error:', detail)
    return NextResponse.json({ error: 'AI service error', detail }, { status: 502 })
  }

  if (!rawText) {
    return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
  }

  const { cleanText, metadata } = postProcess(rawText)

  return NextResponse.json({
    reply: cleanText,
    escalation: metadata.escalation,
    intent: metadata.intent,
    language: metadata.language,
  })
}
