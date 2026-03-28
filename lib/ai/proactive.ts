import type { HotelConfig } from '@/lib/knowledge-base/types'
import type { RealtimeContext } from '@/lib/context/builder'

export type ProactiveMessage = {
  text: string
  type: 'weather' | 'sunset' | 'localEvent' | 'hotelEvent'
}

export function getProactiveMessage(
  hotel: HotelConfig,
  context: RealtimeContext,
  alreadySentToday: boolean
): ProactiveMessage | null {
  const { proactive } = hotel

  if (!proactive.enabled || alreadySentToday) return null

  const [quietFrom] = proactive.quietHours.from.split(':').map(Number)
  const [quietTo] = proactive.quietHours.to.split(':').map(Number)
  const [currentHour] = context.localTime.split(':').map(Number)
  if (currentHour >= quietFrom || currentHour < quietTo) return null

  if (proactive.triggers.weather && context.weather.recommendation) {
    return {
      type: 'weather',
      text: `Weather update: ${context.weather.condition}, ${context.weather.temperatureCelsius}°C. ${context.weather.recommendation}`,
    }
  }

  if (proactive.triggers.localEvents && context.localEvents.length > 0) {
    const event = context.localEvents[0]
    return {
      type: 'localEvent',
      text: `Local tip: ${event.name} — ${event.description}`,
    }
  }

  if (proactive.triggers.hotelEvents && hotel.events.length > 0) {
    const event = hotel.events[0]
    return {
      type: 'hotelEvent',
      text: `This evening: ${event.name}. ${event.description} ${event.time} at ${event.location}.`,
    }
  }

  return null
}
