export interface ResponseMetadata {
  intent: string
  escalation: 'none' | 'low' | 'high' | 'critical'
  language: string
}

const DEFAULT_META: ResponseMetadata = {
  intent: 'question',
  escalation: 'none',
  language: 'en',
}

export function postProcess(rawResponse: string): {
  cleanText: string
  metadata: ResponseMetadata
} {
  const metaMatch = rawResponse.match(
    /\[META:\s*intent=([\w_]+),\s*escalation=(\w+),\s*language=(\w+)\]/
  )

  if (metaMatch) {
    const metadata: ResponseMetadata = {
      intent: metaMatch[1],
      escalation: metaMatch[2] as ResponseMetadata['escalation'],
      language: metaMatch[3],
    }
    const cleanText = rawResponse.replace(/\n?\[META:.*?\]/, '').trim()
    return { cleanText, metadata }
  }

  return { cleanText: rawResponse.trim(), metadata: DEFAULT_META }
}
