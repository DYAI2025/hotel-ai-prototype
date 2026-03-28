import type { EscalationDecision } from './escalation'
import type { HotelConfig } from '@/lib/knowledge-base/types'

export type EscalationAction = {
  systemNote: string | null
  appendToResponse: string | null
}

export function handleEscalation(
  decision: EscalationDecision,
  hotel: HotelConfig
): EscalationAction {
  if (decision.level === 3) {
    return {
      systemNote: 'HANDOFF: Guest requires human staff immediately.',
      appendToResponse: hotel.escalation.humanHandoffMessage,
    }
  }

  if (decision.level === 2 && decision.gesture) {
    return {
      systemNote: `LOG: Goodwill gesture offered — ${decision.gesture}`,
      appendToResponse: null,
    }
  }

  if (decision.level === 1) {
    return {
      systemNote: 'LOG: Complaint noted — staff review recommended.',
      appendToResponse: null,
    }
  }

  return { systemNote: null, appendToResponse: null }
}
