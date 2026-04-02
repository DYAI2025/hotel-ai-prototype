export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type GuestContext = {
  name: string
  room?: string
  stayNights?: number
}

export type ChatRequestBody = {
  hotelId: string
  message: string
  history: ChatMessage[]
  guestContext?: GuestContext
}

export class ChatApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function isChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') return false
  const maybeMessage = message as Record<string, unknown>
  return (
    (maybeMessage.role === 'user' || maybeMessage.role === 'assistant') &&
    typeof maybeMessage.content === 'string' &&
    maybeMessage.content.trim().length > 0
  )
}

function isGuestContext(value: unknown): value is GuestContext {
  if (!value || typeof value !== 'object') return false

  const guest = value as Record<string, unknown>
  const hasValidName = typeof guest.name === 'string' && guest.name.trim().length > 0
  const hasValidRoom = guest.room === undefined || typeof guest.room === 'string'
  const hasValidStay = guest.stayNights === undefined || (typeof guest.stayNights === 'number' && guest.stayNights > 0)

  return hasValidName && hasValidRoom && hasValidStay
}

export function parseChatRequestBody(body: unknown): ChatRequestBody {
  if (!body || typeof body !== 'object') {
    throw new ChatApiError(400, 'INVALID_BODY', 'Invalid request body. Expected a JSON object.')
  }

  const candidate = body as Record<string, unknown>
  const hotelId = typeof candidate.hotelId === 'string' ? candidate.hotelId.trim() : ''
  const message = typeof candidate.message === 'string' ? candidate.message.trim() : ''

  if (!hotelId) {
    throw new ChatApiError(400, 'INVALID_HOTEL_ID', 'Invalid hotelId. Expected a non-empty string.', {
      field: 'hotelId',
    })
  }

  if (!message) {
    throw new ChatApiError(400, 'INVALID_MESSAGE', 'Invalid message. Expected a non-empty string.', {
      field: 'message',
    })
  }

  let history: ChatMessage[] = []
  if (candidate.history !== undefined) {
    if (!Array.isArray(candidate.history) || !candidate.history.every(isChatMessage)) {
      throw new ChatApiError(400, 'INVALID_HISTORY', 'Invalid history. Expected an array of chat messages.', {
        field: 'history',
      })
    }
    history = candidate.history
  }

  let guestContext: GuestContext | undefined
  if (candidate.guestContext !== undefined) {
    if (!isGuestContext(candidate.guestContext)) {
      throw new ChatApiError(
        400,
        'INVALID_GUEST_CONTEXT',
        'Invalid guestContext. Expected { name: string, room?: string, stayNights?: number }.',
        { field: 'guestContext' }
      )
    }
    guestContext = candidate.guestContext
  }

  return {
    hotelId,
    message,
    history,
    guestContext,
  }
}
