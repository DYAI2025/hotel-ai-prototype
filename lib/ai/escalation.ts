import type { HotelConfig } from '@/lib/knowledge-base/types'
import type { InterpretedMessage } from './interpreter'

export type EscalationDecision = {
  level: 0 | 1 | 2 | 3
  gesture: string | null
  handoff: boolean
}

export function decideEscalation(
  interpreted: InterpretedMessage,
  hotel: HotelConfig
): EscalationDecision {
  const { intent, escalationLevel } = interpreted

  if (intent === 'emergency' || escalationLevel === 3) {
    return { level: 3, gesture: null, handoff: true }
  }

  if (escalationLevel === 2) {
    const category = hotel.escalation.categories.find(
      (c) => c.defaultLevel <= 2 && c.allowedGestures.length > 0
    )
    const gestureName = category?.allowedGestures[0] ?? null
    const gesture = gestureName
      ? hotel.escalation.goodwillGestures.find((g) => g.type === gestureName)?.description ?? null
      : null
    return { level: 2, gesture, handoff: false }
  }

  if (escalationLevel === 1) {
    return { level: 1, gesture: null, handoff: false }
  }

  return { level: 0, gesture: null, handoff: false }
}
