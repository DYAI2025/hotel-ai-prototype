import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { loadHotelConfig } from '@/lib/knowledge-base/loader'
import { toHotelKnowledge } from '@/lib/knowledge-base/mapper'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { postProcess } from '@/lib/post-processor'
import { ChatApiError, parseChatRequestBody, type ChatMessage } from '@/lib/api/chat'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()
  let hotelId: string, message: string, history: ChatMessage[], guestContext: { name: string; room?: string; stayNights?: number } | undefined
  try {
    const body = await req.json()
    ;({ hotelId, message, history, guestContext } = parseChatRequestBody(body))
  } catch (err) {
    if (err instanceof ChatApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code, details: err.details, requestId },
        { status: err.status }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON payload.', code: 'INVALID_JSON', requestId }, { status: 400 })
  }

  let hotelConfig
  try {
    hotelConfig = loadHotelConfig(hotelId)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Hotel not found.', code: 'HOTEL_NOT_FOUND', detail, requestId }, { status: 404 })
  }

  const hotel = toHotelKnowledge(hotelConfig)
  const systemPrompt = buildSystemPrompt(hotel, guestContext)

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
    console.error(`[chat/route] Anthropic error (${requestId}):`, detail)
    return NextResponse.json({ error: 'AI service error.', code: 'AI_SERVICE_ERROR', detail, requestId }, { status: 502 })
  }

  if (!rawText) {
    return NextResponse.json({ error: 'Empty response from AI.', code: 'EMPTY_AI_RESPONSE', requestId }, { status: 502 })
  }

  const { cleanText, metadata } = postProcess(rawText)

  const escalationLevelMap: Record<string, number> = { none: 0, low: 1, high: 2, critical: 3 }
  const escalationLevel = escalationLevelMap[metadata.escalation] ?? 0

  return NextResponse.json({
    reply: cleanText,
    escalationLevel,
    handoff: escalationLevel >= 3,
    intent: metadata.intent,
    language: metadata.language,
  })
}
