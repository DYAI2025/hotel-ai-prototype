# Hotel AI Concierge — Design Document
**Date:** 2026-03-28
**Status:** Approved

---

## 1. Project Scope

A multi-hotel AI concierge prototype built with Next.js, TypeScript, Tailwind CSS, and the Anthropic API.

**Core capabilities:**
- Answer guest questions using per-hotel knowledge data
- Detect intent and escalation signals before responding
- Apply formal, human-like tone — guest must not perceive AI
- Send proactive messages (weather, sunset, events) within defined limits
- Support multiple hotels simultaneously via URL-based routing
- Auto-detect guest language and respond accordingly

---

## 2. Architecture Overview

```
/app
  /hotel/[hotelId]
    /page.tsx                  ← Chat UI (WhatsApp-style)
    /api/chat/route.ts         ← API route, orchestrates full pipeline

/lib
  /hotels/
    grand-hotel.ts             ← Per-hotel config (typed TS object)
    beach-resort.ts
    index.ts                   ← Registry: maps hotelId → config
  /knowledge-base/
    types.ts                   ← Full schema types
    loader.ts                  ← Loads + validates config by hotelId
  /context/
    builder.ts                 ← Assembles real-time context
    weather.ts                 ← Mock weather data (real API later)
    events.ts                  ← Mock local + hotel events
  /ai/
    interpreter.ts             ← Intent + escalation signal detection
    prompt-builder.ts          ← System prompt from KB + context + rules
    responder.ts               ← Calls Anthropic, enforces responseRules
    escalation.ts              ← Hybrid escalation decision logic
    escalationHandler.ts       ← Concrete actions per escalation level
    proactive.ts               ← Proactive message engine

/components
  /chat/
    ChatWindow.tsx
    MessageBubble.tsx          ← guest | ai | system variants
    InputBar.tsx
    SystemAlert.tsx            ← Proactive + escalation notices
```

**Key architectural principle:** Knowledge (facts) and behavior (rules) are strictly separated.
- `/knowledge-base/` — what the hotel *is*
- `/ai/prompt-builder.ts` — how the AI *behaves*
- `/context/builder.ts` — what is happening *right now*
- `/ai/interpreter.ts` — what the guest *means*

---

## 3. Knowledge Base Schema

Each hotel is a single typed TypeScript config file:

```ts
type HotelConfig = {
  id: string
  name: string
  location: { city, country, timezone, coordinates }
  contact: { phone, email, whatsapp }
  policies: { checkIn, checkOut, cancellation, pets, smoking }
  wifi: { ssid, password }

  responseRules: {
    formalAddress: boolean        // "Sie" vs "du"
    avoidSuggestions: boolean     // no "if you want", "maybe", etc.
    maxSentences: number
    neverMentionAI: boolean
    language: 'auto' | string
  }

  proactive: {
    enabled: boolean
    quietHours: { from: string, to: string }
    maxPerDay: number
    triggers: {
      weather: boolean
      sunset: boolean
      localEvents: boolean
      hotelEvents: boolean
    }
  }

  guestContext: {
    detectLanguage: boolean
    personalization: boolean
    defaultLanguage: string
  }

  facilities: {
    [key: string]: {
      available: boolean
      hours: string
      notes: string
      rules: string[]
      responseHint: string
    }
  }

  dining: {
    name: string
    type: string
    hours: string
    dresscode: string
    reservations: boolean
    responseHint: string
  }[]

  services: {
    name: string
    available: boolean
    hours: string
    notes: string
    responseHint: string
  }[]

  events: HotelEvent[]
  localArea: LocalTip[]
  faqs: FAQ[]
  tone: ToneProfile
  escalation: EscalationConfig
}
```

---

## 4. AI Layer

### Intent Classification

```ts
type GuestIntent =
  | 'info_request'      // Factual question about hotel or surroundings
  | 'complaint'         // Any dissatisfaction, minor or serious
  | 'service_request'   // Actionable request (towels, booking, taxi, etc.)
  | 'smalltalk'         // Greeting, farewell, casual exchange
  | 'emergency'         // Safety, medical, security — immediate escalation
```

### Escalation Levels

```
0 → AI handles fully, no handoff
1 → AI handles, logs for staff review
2 → AI de-escalates + offers goodwill gesture within config limits
3 → AI acknowledges, immediately hands off to human staff
```

`emergency` always maps to level 3. `complaint` maps to 1–3 based on severity and repetition. Escalation level is derived from intent + content — not a separate classification step.

### Escalation Config (per hotel)

Each hotel defines per-category:
- What the AI resolves autonomously
- What triggers human handoff
- Approved goodwill gestures with limits (late checkout, complimentary drink, room upgrade, etc.)
- The AI never invents gestures or exceeds config-defined limits

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `interpreter.ts` | Classifies intent + escalation level from guest message |
| `prompt-builder.ts` | Assembles system prompt from KB + responseRules + real-time context |
| `responder.ts` | Calls Anthropic API, strips AI references, enforces maxSentences, removes hedging |
| `escalation.ts` | Hybrid decision: config bounds + AI judgment within those bounds |
| `escalationHandler.ts` | Maps escalation level to concrete action (log / gesture / handoff) |
| `proactive.ts` | Evaluates triggers on load, respects quiet hours, returns ProactiveMessage or null |

### `responder.ts` post-processing rules
- Strip AI self-references ("Als KI...", "As an AI...")
- Enforce `maxSentences`
- Remove hedging language ("vielleicht", "if you want", "possibly")
- Ensure response ends with a concrete statement or clear next step

---

## 5. Context Builder

Assembled per request, injected into system prompt:

```ts
type RealtimeContext = {
  currentTime: string         // Local hotel time
  currentDate: string
  weather: MockWeatherData    // Mock for v1, real API later
  sunset: string              // Calculated from coordinates + date
  activeHotelEvents: HotelEvent[]
  activeLocalEvents: LocalTip[]
}
```

Proactive trigger priority: `safety → weather → sunset → localEvents → hotelEvents`

---

## 6. Chat UI

### Message Types

```ts
type MessageType = 'guest' | 'ai' | 'system'
// guest  → right-aligned, dark bubble
// ai     → left-aligned, light bubble, no AI label
// system → centered, muted — proactive alerts and escalation notices
```

### API Contract

Request: `{ messages: Message[], hotelId: string }`

Response: `{ message: string, escalationLevel: 0 | 1 | 2 | 3 }`

UI reacts to `escalationLevel` — level 3 renders a `SystemAlert` with handoff notice.

### Pipeline per request (server-side)
1. Load hotel config by `hotelId`
2. Build real-time context (`context/builder.ts`)
3. Classify intent + escalation level (`interpreter.ts`)
4. Build system prompt (`prompt-builder.ts`)
5. Call Anthropic API + clean output (`responder.ts`)
6. Execute escalation action if needed (`escalationHandler.ts`)
7. Return `{ message, escalationLevel }`

---

## 7. Multi-Hotel Routing

- URL pattern: `/hotel/[hotelId]`
- `hotelId` maps to a config file via `lib/hotels/index.ts`
- Each hotel is fully isolated — no shared state
- Adding a new hotel = adding one TypeScript config file + registering the ID

---

## 8. Out of Scope (v1)

- Real weather API (mocked)
- Database / persistent conversation history
- Authentication / admin panel
- WhatsApp webhook integration
- Streaming responses
