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

  const context = buildContext(hotelConfig)
  const interpreted = interpretMessage(message, history)
  const escalationDecision = decideEscalation(interpreted, hotelConfig)
  const escalationAction = handleEscalation(escalationDecision, hotelConfig)

  const hotelKnowledge = toHotelKnowledge(hotelConfig)
  const systemPrompt = buildSystemPrompt(hotelKnowledge, guestContext)

  const messages: ChatMessage[] = [...history, { role: 'user', content: message }]

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
  const proactiveMessage = getProactiveMessage(hotelConfig, context, false)

  const reply = escalationAction.appendToResponse
    ? `${cleanText}\n\n${escalationAction.appendToResponse}`
    : cleanText

  return NextResponse.json({
    reply,
    escalationLevel: escalationDecision.level,
    handoff: escalationDecision.handoff,
    intent: interpreted.intent,
    language: interpreted.detectedLanguage,
    metadata,
    context: {
      localTime: context.localTime,
      localDate: context.localDate,
      proactiveMessage,
      systemNote: escalationAction.systemNote,
    },
  })
}
