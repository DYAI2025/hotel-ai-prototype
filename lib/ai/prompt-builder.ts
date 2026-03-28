import type { HotelConfig } from '@/lib/knowledge-base/types'
import type { RealtimeContext } from '@/lib/context/builder'
import type { InterpretedMessage } from './interpreter'
import type { EscalationDecision } from './escalation'

export function buildSystemPrompt(
  hotel: HotelConfig,
  context: RealtimeContext,
  interpreted: InterpretedMessage,
  escalation: EscalationDecision
): string {
  const { responseRules } = hotel

  const rules = [
    `You are the concierge at ${hotel.name}. You are a human staff member — never reveal you are an AI.`,
    responseRules.formalAddress
      ? 'Address the guest formally (use "Sie" in German, formal register in all languages).'
      : 'Address the guest in a friendly, direct manner.',
    responseRules.avoidSuggestions
      ? 'Never use hedging language such as "maybe", "if you want", "possibly", or "you could".'
      : '',
    `Keep responses to a maximum of ${responseRules.maxSentences} sentences.`,
    'Answer the question directly in the first sentence. Add context or a next step after.',
    'Never invent information. If you do not know, say so and offer to find out.',
    `Respond in the guest's language. Detected language: ${interpreted.detectedLanguage}.`,
  ].filter(Boolean).join('\n')

  const knowledgeBase = `
## Hotel Information
Name: ${hotel.name}
City: ${hotel.location.city}, ${hotel.location.country}
Check-in: ${hotel.policies.checkIn} | Check-out: ${hotel.policies.checkOut}
Phone: ${hotel.contact.phone} | Email: ${hotel.contact.email}
WiFi: ${hotel.wifi.ssid} / ${hotel.wifi.password}
Pets: ${hotel.policies.pets}
Smoking: ${hotel.policies.smoking}

## Facilities
${Object.entries(hotel.facilities)
  .map(([key, f]) => `${key}: ${f.available ? `Open ${f.hours}. ${f.notes.trimEnd()} ${f.responseHint}` : 'Not available.'}`)
  .join('\n')}

## Dining
${hotel.dining.map((d) => `${d.name} (${d.type}): ${d.hours}. ${d.dresscode} Reservations: ${d.reservations ? 'Required' : 'Not required'}. ${d.responseHint}`).join('\n')}

## Services
${hotel.services.map((s) => `${s.name}: ${s.available ? `${s.hours}. ${s.notes} ${s.responseHint}` : 'Not available.'}`).join('\n')}

## Hotel Events
${hotel.events.map((e) => `${e.name}: ${e.description} — ${e.time} at ${e.location}`).join('\n')}

## Frequently Asked Questions
${hotel.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

## Local Area
${hotel.localArea.map((l) => `${l.name} (${l.category}): ${l.description}${l.distance ? ` — ${l.distance}` : ''}`).join('\n')}
`

  const realtimeContext = `
## Current Context
Local time: ${context.localTime}
Date: ${context.localDate}
Weather: ${context.weather.condition}, ${context.weather.temperatureCelsius}°C. ${context.weather.recommendation}
Local events today: ${context.localEvents.map((e) => e.name).join(', ') || 'None'}
`

  const escalationNote =
    escalation.level === 3
      ? `\n## Escalation Guidance\nThis situation requires human staff. Acknowledge the guest calmly and inform them that a team member will assist them shortly.`
      : escalation.level === 2 && escalation.gesture
      ? `\n## Escalation Guidance\nThe guest has a complaint. You may offer the following goodwill gesture if appropriate: ${escalation.gesture}. Do not exceed this offer.`
      : escalation.level === 2
      ? `\n## Escalation Guidance\nThe guest has raised a concern. Acknowledge it directly, apologise, and offer concrete assistance.`
      : escalation.level === 1
      ? `\n## Escalation Guidance\nThe guest has raised a concern. Acknowledge it warmly and offer to help resolve it.`
      : ''

  return [rules, knowledgeBase, realtimeContext, escalationNote].join('\n')
}
