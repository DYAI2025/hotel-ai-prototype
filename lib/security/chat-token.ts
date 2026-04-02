import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TTL_SECONDS = 60 * 60 * 24

function getSecret(): string {
  const secret = process.env.CHAT_TOKEN_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('CHAT_TOKEN_SECRET must be set and at least 16 characters long')
  }
  return secret
}

function sign(payloadBase64: string): string {
  return createHmac('sha256', getSecret()).update(payloadBase64).digest('base64url')
}

export type ChatTokenPayload = {
  hotelId: string
  iat: number
  exp: number
}

export function createChatToken(hotelId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + ttlSeconds
  const payload: ChatTokenPayload = { hotelId, iat, exp }
  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = sign(payloadBase64)
  return `${payloadBase64}.${signature}`
}

export function verifyChatToken(token: string, expectedHotelId: string): { valid: true; payload: ChatTokenPayload } | { valid: false; reason: string } {
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false, reason: 'Malformed token' }

  const [payloadBase64, providedSignature] = parts
  const expectedSignature = sign(payloadBase64)

  const providedBuf = Buffer.from(providedSignature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: 'Invalid signature' }
  }

  let payload: ChatTokenPayload
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as ChatTokenPayload
  } catch {
    return { valid: false, reason: 'Invalid payload' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) return { valid: false, reason: 'Token expired' }
  if (payload.hotelId !== expectedHotelId) return { valid: false, reason: 'Hotel mismatch' }

  return { valid: true, payload }
}
