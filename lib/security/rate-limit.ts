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
  // Prefer a trusted real IP header when available (typically set by a proxy)
  const realIp = headers.get('x-real-ip') ?? headers.get('X-Real-IP')
  if (realIp && realIp.trim()) {
    return realIp.trim()
  }

  // Fall back to the first value in x-forwarded-for (may be spoofable if not sanitized by infra)
  const forwarded = headers.get('x-forwarded-for') ?? headers.get('X-Forwarded-For')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) {
      return first
    }
  }

  // As a last resort, avoid a shared constant like 'unknown' which would group all such
  // requests into the same rate-limit bucket. Instead, generate a pseudo-unique identifier
  // so that these requests do not interfere with each other's buckets.
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
