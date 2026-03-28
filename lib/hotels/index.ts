import type { HotelConfig } from '@/lib/knowledge-base/types'
import { grandHotel } from './grand-hotel'

const registry: Record<string, HotelConfig> = {
  'grand-hotel': grandHotel,
}

export function getHotelConfig(hotelId: string): HotelConfig | null {
  return registry[hotelId] ?? null
}
