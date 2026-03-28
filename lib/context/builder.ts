import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { HotelConfig } from '@/lib/knowledge-base/types'
import { getMockWeather, type WeatherData } from './weather'
import { getMockLocalEvents, type LocalEvent } from './events'

export type RealtimeContext = {
  localTime: string
  localDate: string
  weather: WeatherData
  localEvents: LocalEvent[]
}

export function buildContext(hotel: HotelConfig): RealtimeContext {
  const now = new Date()
  const zoned = toZonedTime(now, hotel.location.timezone)

  return {
    localTime: format(zoned, 'HH:mm'),
    localDate: format(zoned, 'EEEE, d MMMM yyyy'),
    weather: getMockWeather(hotel.location.city),
    localEvents: getMockLocalEvents(hotel.location.city),
  }
}
