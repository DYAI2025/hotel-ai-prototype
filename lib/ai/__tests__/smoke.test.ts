/**
 * Smoke tests for the AI layer — no network calls, no API key required.
 */

import { interpretMessage } from '../interpreter'
import { decideEscalation } from '../escalation'
import { buildSystemPrompt } from '../prompt-builder'
import { handleEscalation } from '../escalationHandler'
import { getProactiveMessage } from '../proactive'
import { grandHotel } from '@/lib/hotels/grand-hotel'
import { buildContext } from '@/lib/context/builder'

const hotel = grandHotel
const context = buildContext(hotel)

// ---------- interpretMessage ----------

const cases: [string, string, number][] = [
  ['fire in room', 'emergency', 3],
  ['there is too much noise in my room', 'complaint', 2],
  ['I want to book a table', 'service_request', 0],
  ['hello there', 'smalltalk', 0],
  ['what time is check-out?', 'info_request', 0],
]

for (const [msg, intent, level] of cases) {
  const result = interpretMessage(msg, [])
  if (result.intent !== intent) throw new Error(`Expected intent "${intent}" for "${msg}", got "${result.intent}"`)
  if (result.escalationLevel !== level) throw new Error(`Expected level ${level} for "${msg}", got ${result.escalationLevel}`)
}

// repeated complaint escalates to level 3
const repeated = interpretMessage('my room is still broken', [
  { role: 'user', content: 'There is a problem with the heating' },
])
if (repeated.escalationLevel !== 3) throw new Error(`Repeated complaint should be level 3, got ${repeated.escalationLevel}`)

// false-positive guard: "hot" alone should NOT trigger repeated escalation
const notRepeated = interpretMessage('it is hot outside today', [
  { role: 'user', content: 'The weather is hot' },
])
// history only contains "hot" — repeatedComplaintTerms does not include "hot"
if (notRepeated.intent === 'complaint' && notRepeated.escalationLevel === 3) {
  throw new Error('False positive: "hot" in history should not escalate to level 3')
}

// ---------- decideEscalation ----------

const level2 = decideEscalation(
  { intent: 'complaint', escalationLevel: 2, detectedLanguage: 'en' },
  hotel
)
if (level2.level !== 2) throw new Error('Expected level 2')

const level3 = decideEscalation(
  { intent: 'emergency', escalationLevel: 3, detectedLanguage: 'en' },
  hotel
)
if (!level3.handoff) throw new Error('Expected handoff for emergency')

// ---------- buildSystemPrompt ----------

const prompt = buildSystemPrompt(hotel, context, { intent: 'complaint', escalationLevel: 1, detectedLanguage: 'en' }, level2)
if (!prompt.includes(hotel.name)) throw new Error('Prompt missing hotel name')
if (!prompt.includes('Escalation Guidance')) throw new Error('Prompt missing escalation guidance')

// ---------- handleEscalation ----------

const action = handleEscalation({ level: 2, gesture: null, handoff: false }, hotel)
if (!action.systemNote?.includes('no gesture')) throw new Error('Missing no-gesture systemNote')

const action3 = handleEscalation({ level: 3, gesture: null, handoff: true }, hotel)
if (!action3.appendToResponse) throw new Error('Level 3 must append handoff message')

// ---------- getProactiveMessage ----------

// During quiet hours (22:00–07:00) → null
const msgDuringQuiet = getProactiveMessage(
  hotel,
  { ...context, localTime: '23:30' },
  false
)
if (msgDuringQuiet !== null) throw new Error('Expected null during quiet hours')

// During active hours → message
const msgActive = getProactiveMessage(
  hotel,
  { ...context, localTime: '14:00' },
  false
)
if (!msgActive) throw new Error('Expected proactive message during active hours')

// alreadySentToday → null
const msgAlready = getProactiveMessage(hotel, { ...context, localTime: '14:00' }, true)
if (msgAlready !== null) throw new Error('Expected null when alreadySentToday')

console.log('All smoke tests passed.')
