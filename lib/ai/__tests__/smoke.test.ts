/**
 * Smoke tests for the AI layer — no network calls, no API key required.
 */

import { buildSystemPrompt } from '../prompt-builder'
import { getProactiveMessage } from '../proactive'
import { grandHotel } from '@/lib/hotels/grand-hotel'
import { buildContext } from '@/lib/context/builder'
import { toHotelKnowledge } from '@/lib/knowledge-base/mapper'

const hotel = grandHotel
const knowledge = toHotelKnowledge(hotel)
const context = buildContext(hotel)

// ---------- buildSystemPrompt ----------

const prompt = buildSystemPrompt(knowledge)
if (!prompt.includes(hotel.name)) throw new Error('Prompt missing hotel name')
if (!prompt.includes('CORE RULES')) throw new Error('Prompt missing core rules')
if (!prompt.includes('HEARD')) throw new Error('Prompt missing HEARD framework')
if (!prompt.includes(hotel.wifi.ssid)) throw new Error('Prompt missing WiFi SSID')
if (!prompt.includes(hotel.policies.checkIn)) throw new Error('Prompt missing check-in time')

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
