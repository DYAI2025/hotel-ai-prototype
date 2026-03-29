import type { HotelConfig, HotelKnowledge } from './types'

export function toHotelKnowledge(hotel: HotelConfig): HotelKnowledge {
  // On-site dining as restaurants
  const diningRestaurants = hotel.dining.map((d) => ({
    name: d.name,
    cuisine: d.type,
    distance: 'On-site',
    highlight: `${d.hours}. ${d.dresscode} ${d.responseHint}`.trim(),
  }))

  // Local restaurants from localArea
  const localRestaurants = hotel.localArea
    .filter((l) => l.category === 'restaurant')
    .map((l) => ({
      name: l.name,
      cuisine: 'Local',
      distance: l.distance ?? 'Nearby',
      highlight: l.description,
    }))

  // Attractions from localArea
  const attractions = hotel.localArea
    .filter((l) => l.category === 'attraction' || l.category === 'tip')
    .map((l) => ({
      name: l.name,
      distance: l.distance ?? 'Nearby',
      description: l.description,
    }))

  // Transport from localArea
  const transportEntries = hotel.localArea.filter((l) => l.category === 'transport')
  const airportEntry = transportEntries.find((t) => t.name.toLowerCase().includes('airport'))
  const metroEntry = transportEntries.find((t) => !t.name.toLowerCase().includes('airport'))

  // Amenities from services + facilities
  const amenities: string[] = [
    ...hotel.services
      .filter((s) => s.available)
      .map((s) => `${s.name}: ${s.hours}. ${s.notes}`),
    ...Object.entries(hotel.facilities)
      .filter(([, f]) => f.available)
      .map(([key, f]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: open ${f.hours}. ${f.notes}`),
  ]

  // Breakfast from dining
  const breakfastOutlet = hotel.dining.find(
    (d) => d.hours.toLowerCase().includes('breakfast') || d.type.toLowerCase().includes('breakfast')
  )

  return {
    name: hotel.name,
    tone: hotel.tone.style,
    location: {
      address: `${hotel.location.city}, ${hotel.location.country}`,
      city: hotel.location.city,
      country: hotel.location.country,
    },
    checkin: {
      from: hotel.policies.checkIn,
      until: hotel.policies.checkOut,
      process: 'Present your booking confirmation and ID at the front desk. Key cards are issued immediately.',
      earlyCheckin: 'Early check-in from 12:00 subject to availability at no extra charge.',
      lateCheckout: 'Late check-out until 14:00 subject to availability — please request by 10:00.',
      luggageStorage: 'Complimentary luggage storage available 24 hours, before check-in and after check-out.',
    },
    wifi: {
      network: hotel.wifi.ssid,
      password: hotel.wifi.password,
    },
    breakfast: breakfastOutlet
      ? {
          available: true,
          included: false,
          hours: breakfastOutlet.hours.split('|')[0].replace('Breakfast', '').trim(),
          location: breakfastOutlet.name,
          details: `${breakfastOutlet.dresscode} Hot and cold buffet with à la carte options. Dietary requirements catered for on request.`,
        }
      : undefined,
    parking: {
      available: true,
      free: false,
      details: 'Valet parking at €35 per night. Please inform the concierge upon arrival.',
    },
    amenities,
    restaurants: [...diningRestaurants, ...localRestaurants],
    attractions,
    transport: {
      fromAirport: airportEntry?.description ?? 'City Airport Train (CAT) to Wien Mitte (16 min), then 5 min taxi. Taxi direct approx. €40, 25–35 min.',
      publicTransport: metroEntry?.description ?? 'U-Bahn Karlsplatz (400m): lines U1, U2, U4. Trams 1, 2, D on Ringstraße.',
      taxi: 'Taxi rank outside the hotel. App: Bolt or Uber. 24-hour availability.',
    },
    policies: {
      cancellation: hotel.policies.cancellation,
      houseRules: `${hotel.policies.pets} ${hotel.policies.smoking} Quiet hours from 22:00.`,
      payment: ['Visa', 'Mastercard', 'American Express', 'Cash (EUR)'],
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
