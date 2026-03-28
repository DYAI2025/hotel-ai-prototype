import type { HotelConfig, HotelKnowledge } from './types'

export function toHotelKnowledge(hotel: HotelConfig): HotelKnowledge {
  const diningRestaurants = hotel.dining.map((d) => ({
    name: d.name,
    cuisine: d.type,
    distance: 'on-site',
    highlight: `${d.hours}. ${d.responseHint}`,
  }))

  const localRestaurants = hotel.localArea
    .filter((l) => l.category === 'restaurant')
    .map((l) => ({
      name: l.name,
      cuisine: 'Local',
      distance: l.distance ?? 'nearby',
      highlight: l.description,
    }))

  const attractions = hotel.localArea
    .filter((l) => l.category === 'attraction' || l.category === 'tip')
    .map((l) => ({
      name: l.name,
      distance: l.distance ?? 'nearby',
      description: l.description,
    }))

  const transport = hotel.localArea.find((l) => l.category === 'transport')

  const amenities = hotel.services
    .filter((s) => s.available)
    .map((s) => `${s.name}: ${s.hours}. ${s.notes}`)

  Object.entries(hotel.facilities).forEach(([key, f]) => {
    if (f.available) amenities.push(`${key}: ${f.hours}. ${f.notes}`)
  })

  return {
    name: hotel.name,
    location: {
      address: `${hotel.location.city}, ${hotel.location.country}`,
      city: hotel.location.city,
      country: hotel.location.country,
    },
    checkin: {
      from: hotel.policies.checkIn,
      until: hotel.policies.checkOut,
    },
    wifi: {
      network: hotel.wifi.ssid,
      password: hotel.wifi.password,
    },
    breakfast: (() => {
      const b = hotel.dining.find((d) => d.type.toLowerCase().includes('breakfast') || d.hours.toLowerCase().includes('breakfast'))
      if (!b) return undefined
      return {
        available: true,
        included: false,
        hours: b.hours,
        location: b.name,
        details: b.responseHint,
      }
    })(),
    amenities,
    restaurants: [...diningRestaurants, ...localRestaurants],
    attractions,
    transport: transport
      ? {
          fromAirport: transport.description,
          publicTransport: transport.description,
        }
      : undefined,
    policies: {
      cancellation: hotel.policies.cancellation,
      houseRules: `${hotel.policies.pets}. ${hotel.policies.smoking}`,
      payment: ['Credit card', 'Debit card', 'Cash'],
      pets: hotel.policies.pets,
      smoking: hotel.policies.smoking,
    },
    faq: hotel.faqs,
    escalation: {
      email: hotel.contact.email,
      phone: hotel.contact.phone,
    },
  }
}
