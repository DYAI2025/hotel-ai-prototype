export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type GuestContext = { name: string; room?: string; stayNights?: number }

export type ChatRequestBody = {
  hotelId: string
  message: string
  history: ChatMessage[]
  guestContext?: GuestContext
}

const MAX_MESSAGE_LENGTH = 1500
const MAX_HISTORY_ITEMS = 30
const MAX_HISTORY_MESSAGE_LENGTH = 1500

function isObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null
}

export function parseChatRequestBody(input: unknown): { ok: true; data: ChatRequestBody } | { ok: false; error: string } {
  if (!isObject(input)) return { ok: false, error: 'Invalid JSON body' }

  const hotelId = input.hotelId
  const message = input.message
  const historyRaw = input.history
  const guestContextRaw = input.guestContext

  if (typeof hotelId !== 'string' || hotelId.trim().length === 0) {
    return { ok: false, error: 'hotelId is required' }
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, error: 'message is required' }
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `message exceeds ${MAX_MESSAGE_LENGTH} characters` }
  }

  if (historyRaw !== undefined && !Array.isArray(historyRaw)) {
    return { ok: false, error: 'history must be an array' }
  }

  let historyParsed: ChatMessage[]
  try {
    historyParsed = (historyRaw ?? []).map((item) => {
      if (!isObject(item)) throw new Error('Each history item must be an object')
      const role = item.role
      const content = item.content

      if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
        throw new Error('Invalid history message format')
      }

      if (content.length === 0 || content.length > MAX_HISTORY_MESSAGE_LENGTH) {
        throw new Error(`History message length must be 1-${MAX_HISTORY_MESSAGE_LENGTH}`)
      }

      return { role, content }
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Invalid history'
    return { ok: false, error: detail }
  }

  if (historyParsed.length > MAX_HISTORY_ITEMS) {
    return { ok: false, error: `history exceeds ${MAX_HISTORY_ITEMS} messages` }
  }

  let guestContext: GuestContext | undefined
  if (guestContextRaw !== undefined) {
    if (!isObject(guestContextRaw)) {
      return { ok: false, error: 'guestContext must be an object' }
    }

    const name = guestContextRaw.name
    const room = guestContextRaw.room
    const stayNights = guestContextRaw.stayNights

    if (typeof name !== 'string' || name.trim().length === 0) {
      return { ok: false, error: 'guestContext.name must be a non-empty string' }
    }

    if (room !== undefined && typeof room !== 'string') {
      return { ok: false, error: 'guestContext.room must be a string' }
    }

    if (stayNights !== undefined) {
      if (typeof stayNights !== 'number' || !Number.isInteger(stayNights) || stayNights <= 0 || stayNights > 365) {
        return { ok: false, error: 'guestContext.stayNights must be an integer between 1 and 365' }
      }
    }

    guestContext = { name: name.trim(), room, stayNights: stayNights as number | undefined }
  }

  return {
    ok: true,
    data: {
      hotelId: hotelId.trim(),
      message: message.trim(),
      history: historyParsed,
      guestContext,
    },
  }
}
