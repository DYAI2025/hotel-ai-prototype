import Anthropic from '@anthropic-ai/sdk'
import type { ResponseRules } from '@/lib/knowledge-base/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

// Mock responses used as fallback when API credits are unavailable
const MOCK_RESPONSES: Record<string, string> = {
  info_request: 'Check-in is from 15:00, check-out by 12:00. Our WiFi network is GrandHotel_Guest — password welcome2024. The pool and gym are on level B1 and open daily. Is there anything else I can assist you with?',
  service_request: 'Understood. I will arrange that for you immediately. Our concierge team is available 24 hours and will confirm the details with you shortly.',
  complaint: 'I sincerely apologise for the inconvenience. This is not the standard we hold ourselves to. I am escalating this to our team now and we will resolve it as a priority.',
  smalltalk: 'Good day. Welcome to Grand Hotel Vienna. How may I be of assistance during your stay?',
  emergency: 'Please stay calm. I am alerting our team immediately. A staff member will be with you within moments.',
  default: 'Thank you for your message. I am happy to assist. Could you provide a little more detail so I can give you the most accurate information?',
}

export async function getResponse(
  systemPrompt: string,
  messages: Message[],
  rules: ResponseRules
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return cleanResponse(raw, rules)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('credit balance') || msg.includes('billing')) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
      const intentKey = detectMockIntent(lastUserMessage)
      console.warn('[responder] API credits unavailable — serving mock response for intent:', intentKey)
      return MOCK_RESPONSES[intentKey]
    }
    throw err
  }
}

function detectMockIntent(message: string): keyof typeof MOCK_RESPONSES {
  const lower = message.toLowerCase()
  if (['fire', 'help', 'emergency', 'medical', 'feuer', 'hilfe', 'notfall'].some((t) => lower.includes(t))) return 'emergency'
  if (['problem', 'broken', 'dirty', 'noise', 'complaint', 'terrible', 'kaputt', 'lärm'].some((t) => lower.includes(t))) return 'complaint'
  if (['book', 'reserve', 'order', 'need', 'send', 'bring', 'buchen', 'brauche'].some((t) => lower.includes(t))) return 'service_request'
  if (['hello', 'hi', 'hey', 'thanks', 'bye', 'hallo', 'danke', 'guten'].some((t) => lower.includes(t))) return 'smalltalk'
  return 'info_request'
}

function cleanResponse(text: string, rules: ResponseRules): string {
  let cleaned = text

  const aiPhrases = [
    /as an ai[,.]?/gi,
    /als ki[,.]?/gi,
    /i'm an ai[,.]?/gi,
    /ich bin eine? ki[,.]?/gi,
    /as a language model[,.]?/gi,
  ]
  aiPhrases.forEach((re) => { cleaned = cleaned.replace(re, '') })

  if (rules.avoidSuggestions) {
    const hedges = [
      /\bmaybe\b/gi,
      /\bperhaps\b/gi,
      /\bpossibly\b/gi,
      /\bif you (want|like|wish)\b/gi,
      /\byou could\b/gi,
      /\bvielleicht\b/gi,
      /\bevtl\.?\b/gi,
    ]
    hedges.forEach((re) => { cleaned = cleaned.replace(re, '') })
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
  if (sentences.length > rules.maxSentences) {
    cleaned = sentences.slice(0, rules.maxSentences).join(' ')
  }

  return cleaned.trim()
}
