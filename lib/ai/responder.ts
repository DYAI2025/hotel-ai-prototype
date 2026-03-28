import Anthropic from '@anthropic-ai/sdk'
import type { ResponseRules } from '@/lib/knowledge-base/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export async function getResponse(
  systemPrompt: string,
  messages: Message[],
  rules: ResponseRules
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return cleanResponse(raw, rules)
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
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
  if (sentences.length > rules.maxSentences) {
    cleaned = sentences.slice(0, rules.maxSentences).join(' ')
  }

  return cleaned.trim()
}
