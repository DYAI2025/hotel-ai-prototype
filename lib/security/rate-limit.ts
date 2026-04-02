type Entry = {
  count: number
  resetAt: number
}

const bucket = new Map<string, Entry>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function takeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const current = bucket.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    bucket.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  bucket.set(key, current)

  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
