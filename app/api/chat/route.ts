import { NextRequest, NextResponse } from 'next/server'
import { loadHotelConfig } from '@/lib/knowledge-base/loader'
import { buildContext } from '@/lib/context/builder'
import { interpretMessage } from '@/lib/ai/interpreter'
import { decideEscalation } from '@/lib/ai/escalation'
import { buildSystemPrompt } from '@/lib/ai/prompt-builder'
import { handleEscalation } from '@/lib/ai/escalationHandler'
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
  escalationLevel: number
  handoff: boolean
  systemNote: string | null
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

  let hotel
  try {
    hotel = loadHotelConfig(hotelId)
  } catch {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  const context = buildContext(hotel)
  const interpreted = interpretMessage(message, history ?? [])
  const escalation = decideEscalation(interpreted, hotel)
  const systemPrompt = buildSystemPrompt(hotel, context, interpreted, escalation)
  const escalationAction = handleEscalation(escalation, hotel)

  const messages: ChatMessage[] = [...(history ?? []), { role: 'user', content: message }]

  const aiReply = await getResponse(systemPrompt, messages, hotel.responseRules)

  const reply = escalationAction.appendToResponse
    ? `${aiReply}\n\n${escalationAction.appendToResponse}`
    : aiReply

  const response: ChatResponse = {
    reply,
    escalationLevel: escalation.level,
    handoff: escalation.handoff,
    systemNote: escalationAction.systemNote,
  }

  return NextResponse.json(response)
}
