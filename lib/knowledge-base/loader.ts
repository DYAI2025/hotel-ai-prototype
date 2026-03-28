import type { HotelConfig } from './types'
import { getHotelConfig } from '@/lib/hotels'

export function loadHotelConfig(hotelId: string): HotelConfig {
  const config = getHotelConfig(hotelId)
  if (!config) {
    throw new Error(`Hotel not found: ${hotelId}`)
  }
  return config
}
