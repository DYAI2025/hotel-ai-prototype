import { NextRequest, NextResponse } from 'next/server'
import { loadHotelConfig } from '@/lib/knowledge-base/loader'
import { toHotelKnowledge } from '@/lib/knowledge-base/mapper'
import { buildSystemPrompt } from '@/lib/ai/prompt-builder'
import { getResponse } from '@/lib/ai/responder'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatRequest = {
  hotelId: string
  message: string
  history: ChatMessage[]
}

export type ChatResponse = {
  reply: string
}

export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { hotelId, message, history } = body

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
  const messages: ChatMessage[] = [...(history ?? []), { role: 'user', content: message }]

  let reply: string
  try {
    reply = await getResponse(systemPrompt, messages, hotelConfig.responseRules)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] Anthropic error:', detail)
    return NextResponse.json({ error: 'AI service error', detail }, { status: 502 })
  }

  return NextResponse.json({ reply } satisfies ChatResponse)
}
