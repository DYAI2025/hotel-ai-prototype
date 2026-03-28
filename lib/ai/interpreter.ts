export type GuestIntent =
  | 'info_request'
  | 'complaint'
  | 'service_request'
  | 'smalltalk'
  | 'emergency'

export type InterpretedMessage = {
  intent: GuestIntent
  escalationLevel: 0 | 1 | 2 | 3
  detectedLanguage: string
}

export function interpretMessage(
  message: string,
  history: { role: string; content: string }[]
): InterpretedMessage {
  const lower = message.toLowerCase()

  const emergencyTerms = ['fire', 'help', 'emergency', 'medical', 'police', 'security', 'danger', 'feuer', 'hilfe', 'notfall']
  if (emergencyTerms.some((t) => lower.includes(t))) {
    return { intent: 'emergency', escalationLevel: 3, detectedLanguage: detectLanguage(message) }
  }

  const complaintTerms = ['problem', 'issue', 'broken', 'dirty', 'noise', 'cold', 'hot', 'wrong', 'disappointed', 'unacceptable', 'complaint', 'manager', 'terrible', 'awful', 'nicht funktioniert', 'kaputt', 'lärm']
  if (complaintTerms.some((t) => lower.includes(t))) {
    const isRepeated = history.some(
      (m) => m.role === 'user' && complaintTerms.some((t) => m.content.toLowerCase().includes(t))
    )
    const level = isRepeated ? 3 : lower.includes('manager') || lower.includes('unacceptable') ? 3 : 2
    return { intent: 'complaint', escalationLevel: level, detectedLanguage: detectLanguage(message) }
  }

  const serviceTerms = ['book', 'reserve', 'order', 'need', 'want', 'request', 'send', 'bring', 'arrange', 'buchen', 'bestellen', 'brauche']
  if (serviceTerms.some((t) => lower.includes(t))) {
    return { intent: 'service_request', escalationLevel: 0, detectedLanguage: detectLanguage(message) }
  }

  const smalltalkTerms = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'bye', 'goodbye', 'good morning', 'good evening', 'hallo', 'danke', 'tschüss', 'guten morgen', 'guten abend']
  if (smalltalkTerms.some((t) => lower.includes(t))) {
    return { intent: 'smalltalk', escalationLevel: 0, detectedLanguage: detectLanguage(message) }
  }

  return { intent: 'info_request', escalationLevel: 0, detectedLanguage: detectLanguage(message) }
}

function detectLanguage(message: string): string {
  const germanTerms = ['ich', 'ist', 'nicht', 'und', 'die', 'der', 'das', 'haben', 'können', 'bitte', 'danke', 'wie', 'wann', 'wo']
  const lower = message.toLowerCase()
  const germanMatches = germanTerms.filter((t) => lower.includes(t)).length
  return germanMatches >= 2 ? 'de' : 'en'
}
