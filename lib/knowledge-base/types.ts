export type ToneProfile = {
  style: 'formal' | 'warm' | 'casual'
  language: 'auto' | string
}

export type ResponseRules = {
  formalAddress: boolean
  avoidSuggestions: boolean
  maxSentences: number
  neverMentionAI: boolean
  language: 'auto' | string
}

export type ProactiveConfig = {
  enabled: boolean
  quietHours: { from: string; to: string }
  maxPerDay: number
  triggers: {
    weather: boolean
    sunset: boolean
    localEvents: boolean
    hotelEvents: boolean
  }
}

export type GuestContextConfig = {
  detectLanguage: boolean
  personalization: boolean
  defaultLanguage: string
}

export type Facility = {
  available: boolean
  hours: string
  notes: string
  rules: string[]
  responseHint: string
}

export type DiningOutlet = {
  name: string
  type: string
  hours: string
  dresscode: string
  reservations: boolean
  responseHint: string
}

export type HotelService = {
  name: string
  available: boolean
  hours: string
  notes: string
  responseHint: string
}

export type HotelEvent = {
  name: string
  description: string
  time: string
  location: string
  recurring: boolean
}

export type LocalTip = {
  category: 'transport' | 'attraction' | 'restaurant' | 'tip'
  name: string
  description: string
  distance?: string
}

export type FAQ = {
  question: string
  answer: string
}

export type GoodwillGesture = {
  type: string
  description: string
  maxPerStay: number
}

export type EscalationCategory = {
  name: string
  examples: string[]
  defaultLevel: 0 | 1 | 2 | 3
  allowedGestures: string[]
}

export type EscalationConfig = {
  categories: EscalationCategory[]
  goodwillGestures: GoodwillGesture[]
  humanHandoffMessage: string
  staffContactMethod: string
}

export type HotelKnowledge = {
  name: string
  agentName?: string
  tone?: 'formal' | 'warm' | 'casual'
  location: {
    address: string
    city: string
    country: string
    gpsLink?: string
  }
  checkin: {
    from: string
    until: string
    process?: string
    earlyCheckin?: string
    lateCheckout?: string
    luggageStorage?: string
  }
  wifi: {
    network: string
    password: string
  }
  breakfast?: {
    available: boolean
    included: boolean
    hours: string
    location: string
    details?: string
  }
  parking?: {
    available: boolean
    free: boolean
    details: string
  }
  amenities?: string[]
  restaurants?: {
    name: string
    cuisine: string
    distance: string
    highlight: string
  }[]
  attractions?: {
    name: string
    distance: string
    description: string
  }[]
  transport?: {
    fromAirport: string
    publicTransport?: string
    taxi?: string
  }
  policies?: {
    cancellation: string
    houseRules: string
    payment: string[]
    pets?: string
    smoking?: string
  }
  faq?: {
    question: string
    answer: string
  }[]
  escalation?: {
    email: string
    phone: string
  }
}

export type HotelConfig = {
  id: string
  name: string
  location: {
    city: string
    country: string
    timezone: string
    coordinates: { lat: number; lng: number }
  }
  contact: { phone: string; email: string; whatsapp?: string }
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    pets: string
    smoking: string
  }
  wifi: { ssid: string; password: string }
  responseRules: ResponseRules
  proactive: ProactiveConfig
  guestContext: GuestContextConfig
  facilities: Record<string, Facility>
  dining: DiningOutlet[]
  services: HotelService[]
  events: HotelEvent[]
  localArea: LocalTip[]
  faqs: FAQ[]
  tone: ToneProfile
  escalation: EscalationConfig
}
