import Anthropic from '@anthropic-ai/sdk'
import type { ResponseRules } from '@/lib/knowledge-base/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

// Mock responses used as fallback when API credits are unavailable.
// Keyed by keyword patterns for contextual matching.
const MOCK_RULES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['fire', 'emergency', 'medical', 'police', 'feuer', 'hilfe', 'notfall', 'danger'],
    response: 'Please stay calm — I am alerting our team immediately. A staff member will be with you within moments.',
  },
  {
    keywords: ['loud', 'noise', 'noisy', 'problem', 'broken', 'dirty', 'terrible', 'awful', 'disappointed', 'lärm', 'kaputt'],
    response: 'I am truly sorry to hear this — that is not the experience we want for you. I am contacting our team right away to address this. May I ask your room number so we can assist you immediately?',
  },
  {
    keywords: ['breakfast', 'frühstück'],
    response: 'Breakfast is served from 07:00 to 10:30 in The Grand Restaurant. It is available for an additional charge. Would you like me to reserve a table for you?',
  },
  {
    keywords: ['check-in', 'checkin', 'check in', 'ankunft', 'arrive', 'arrival'],
    response: 'Check-in is from 15:00. Should you arrive earlier, we are happy to store your luggage so you can enjoy the hotel. Is there anything else I can assist you with?',
  },
  {
    keywords: ['check-out', 'checkout', 'check out', 'abreise', 'depart'],
    response: 'Check-out is by 12:00. A late check-out until 14:00 is available subject to availability — shall I arrange that for you?',
  },
  {
    keywords: ['wifi', 'wlan', 'internet', 'password', 'passwort', 'network'],
    response: 'Our WiFi network is GrandHotel_Guest and the password is welcome2024. You are connected throughout the hotel. Is there anything else I can help with?',
  },
  {
    keywords: ['dinner', 'restaurant', 'dining', 'eat', 'lunch', 'food', 'table', 'reserve', 'abendessen', 'essen'],
    response: 'The Grand Restaurant serves dinner from 18:30 to 22:30 — smart casual dress is required and reservations are recommended. Our Lobby Bar is open from 11:00 with live piano from 20:00. Shall I reserve a table for you?',
  },
  {
    keywords: ['pool', 'gym', 'spa', 'fitness', 'schwimm'],
    response: 'Our heated indoor pool and fully equipped gym are both on level B1. The pool is open 07:00–22:00, the gym 06:00–23:00. The spa is open 09:00–21:00 and advance booking is recommended for treatments. Anything else?',
  },
  {
    keywords: ['parking', 'parken', 'car', 'auto'],
    response: 'Valet parking is available at €35 per night. Please let our concierge know upon arrival and they will take care of everything. Is there anything else I can help with?',
  },
  {
    keywords: ['book', 'change', 'cancel', 'refund', 'buchen', 'stornieren', 'umbuchung'],
    response: 'I would love to help with that. Booking changes and cancellations are handled directly by our reservations team — let me connect you with them right away so they can take care of it.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'hallo', 'guten morgen', 'guten abend', 'guten tag', 'grüß'],
    response: 'Good day! Welcome to Grand Hotel Vienna. How may I assist you today?',
  },
  {
    keywords: ['thanks', 'thank you', 'danke', 'merci', 'gracias'],
    response: 'Absolutely — it is my pleasure. Is there anything else I can do for you?',
  },
]

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
      const mockResponse = resolveMockResponse(lastUserMessage)
      console.warn('[responder] API credits unavailable — serving mock response')
      return mockResponse
    }
    throw err
  }
}

function resolveMockResponse(message: string): string {
  const lower = message.toLowerCase()
  for (const rule of MOCK_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.response
  }
  return 'Thank you for your message. Let me check with our team and get back to you shortly. Is there anything else I can assist you with in the meantime?'
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
