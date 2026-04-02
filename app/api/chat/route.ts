import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { loadHotelConfig } from '@/lib/knowledge-base/loader'
import { toHotelKnowledge } from '@/lib/knowledge-base/mapper'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { postProcess } from '@/lib/post-processor'
import { parseChatRequestBody } from '@/lib/api/chat-validation'
import { getClientIp, takeRateLimit } from '@/lib/security/rate-limit'
import { verifyChatToken } from '@/lib/security/chat-token'
import { interpretMessage } from '@/lib/ai/interpreter'
import { decideEscalation } from '@/lib/ai/escalation'
import { handleEscalation } from '@/lib/ai/escalationHandler'
import { buildContext } from '@/lib/context/builder'
import { getProactiveMessage } from '@/lib/ai/proactive'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 20

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rate = takeRateLimit(ip, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS)
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfterSeconds: Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000)),
      },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseChatRequestBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { hotelId, message, history, guestContext } = parsed.data

  const token = req.headers.get('x-chat-token')
  if (!token) {
    return NextResponse.json({ error: 'Missing chat token' }, { status: 401 })
  }

  const tokenResult = verifyChatToken(token, hotelId)
  if (!tokenResult.valid) {
    return NextResponse.json({ error: 'Invalid chat token' }, { status: 401 })
  }

  let hotelConfig
  try {
    hotelConfig = loadHotelConfig(hotelId)
  } catch {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
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
    console.error('[chat/route] Anthropic error:', detail)
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }

  if (!rawText) {
    return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
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
