import type { HotelConfig } from '@/lib/knowledge-base/types'

export const grandHotel: HotelConfig = {
  id: 'grand-hotel',
  name: 'Curt AI Hotel (Prototype)',
  location: {
    city: 'Vienna',
    country: 'Austria',
    timezone: 'Europe/Vienna',
    coordinates: { lat: 48.2082, lng: 16.3738 },
  },
  contact: {
    phone: '+43 1 515 800',
    email: 'concierge@curtaihotel.com',
    whatsapp: '+43 1 515 800',
  },
  policies: {
    checkIn: '15:00',
    checkOut: '12:00',
    cancellation: 'Free cancellation up to 24 hours before arrival.',
    pets: 'Pets are not permitted.',
    smoking: 'The hotel is entirely non-smoking.',
  },
  wifi: { ssid: 'CurtAIHotel_Guest', password: 'welcome2024' },
  responseRules: {
    formalAddress: true,
    avoidSuggestions: true,
    maxSentences: 4,
    neverMentionAI: true,
    language: 'auto',
  },
  proactive: {
    enabled: true,
    quietHours: { from: '22:00', to: '07:00' },
    maxPerDay: 1,
    triggers: {
      weather: true,
      sunset: true,
      localEvents: true,
      hotelEvents: true,
    },
  },
  guestContext: {
    detectLanguage: true,
    personalization: true,
    defaultLanguage: 'en',
  },
  languageTones: {
    de: {
      formalAddress: true,
      style: 'formal',
      hint: 'Always address the guest with "Sie". Use a professional, courteous hotel tone. Avoid casual expressions.',
    },
    en: {
      formalAddress: false,
      style: 'formal',
      hint: 'Use a calm, professional concierge tone. Warm but not casual. Avoid overly familiar language.',
    },
  },
  facilities: {
    pool: {
      available: true,
      hours: '07:00–22:00',
      notes: 'Heated indoor pool on level B1.',
      rules: ['Swimwear required', 'No food or drink poolside'],
      responseHint: 'Mention the pool is heated and open year-round.',
    },
    gym: {
      available: true,
      hours: '06:00–23:00',
      notes: 'Fully equipped fitness centre on level B1.',
      rules: ['Sports attire required'],
      responseHint: 'Mention 24h access with room key card.',
    },
    spa: {
      available: true,
      hours: '09:00–21:00',
      notes: 'Bookings recommended. Access included for suite guests.',
      rules: ['Advance booking required for treatments'],
      responseHint: 'Mention treatments require booking; suite guests have complimentary access.',
    },
  },
  dining: [
    {
      name: 'The Curt Restaurant',
      type: 'Fine dining',
      hours: 'Breakfast 07:00–10:30 | Dinner 18:30–22:30',
      dresscode: 'Smart casual required for dinner.',
      reservations: true,
      responseHint: 'Always mention reservation requirement for dinner.',
    },
    {
      name: 'Lobby Bar',
      type: 'Bar',
      hours: '11:00–01:00',
      dresscode: 'No specific dress code.',
      reservations: false,
      responseHint: 'Mention evening live piano music from 20:00.',
    },
  ],
  services: [
    {
      name: 'Room Service',
      available: true,
      hours: '24 hours',
      notes: 'Full menu available around the clock.',
      responseHint: 'Mention average delivery time is 20 minutes.',
    },
    {
      name: 'Laundry',
      available: true,
      hours: 'Same-day if received before 09:00',
      notes: 'Express service available for additional fee.',
      responseHint: 'Mention same-day deadline of 09:00.',
    },
    {
      name: 'Concierge',
      available: true,
      hours: '24 hours',
      notes: 'Restaurant reservations, tickets, transport arrangements.',
      responseHint: 'Offer to assist with bookings or transport directly.',
    },
  ],
  events: [
    {
      name: 'Evening Piano',
      description: 'Live piano performance in the Lobby Bar.',
      time: 'Daily 20:00–23:00',
      location: 'Lobby Bar',
      recurring: true,
    },
  ],
  localArea: [
    {
      category: 'attraction',
      name: 'Kunsthistorisches Museum',
      description: 'World-class art museum, 10 minutes on foot.',
      distance: '800m',
    },
    {
      category: 'transport',
      name: 'U-Bahn Karlsplatz',
      description: 'Nearest metro station, lines U1, U2, U4.',
      distance: '400m',
    },
    {
      category: 'tip',
      name: 'Naschmarkt',
      description: "Vienna's most famous open-air market. Open Mon–Sat from 06:00.",
      distance: '1.2km',
    },
  ],
  faqs: [
    {
      question: 'Is parking available?',
      answer: 'Valet parking is available at €35 per night. Please inform the concierge upon arrival.',
    },
    {
      question: 'What is the check-in time?',
      answer: 'Check-in is from 15:00. Early check-in is subject to availability and can be requested at the front desk.',
    },
  ],
  tone: { style: 'formal', language: 'auto' },
  escalation: {
    categories: [
      {
        name: 'Room issue',
        examples: ['noise', 'temperature', 'cleanliness', 'equipment malfunction'],
        defaultLevel: 1,
        allowedGestures: ['complimentary_drink', 'late_checkout'],
      },
      {
        name: 'Service failure',
        examples: ['wrong order', 'long wait', 'missing item'],
        defaultLevel: 2,
        allowedGestures: ['complimentary_drink', 'meal_credit'],
      },
      {
        name: 'Serious complaint',
        examples: ['repeated unresolved issue', 'billing dispute', 'discrimination'],
        defaultLevel: 3,
        allowedGestures: [],
      },
      {
        name: 'Emergency',
        examples: ['medical', 'fire', 'security', 'safety concern'],
        defaultLevel: 3,
        allowedGestures: [],
      },
    ],
    goodwillGestures: [
      { type: 'complimentary_drink', description: 'One complimentary drink at the Lobby Bar.', maxPerStay: 1 },
      { type: 'late_checkout', description: 'Late checkout until 14:00 subject to availability.', maxPerStay: 1 },
      { type: 'meal_credit', description: 'Credit of up to €30 toward dining.', maxPerStay: 1 },
    ],
    humanHandoffMessage: {
      de: 'Ich verbinde Sie kurz mit einem Kollegen vom Empfang.',
      en: 'I will connect you with a member of our front desk team right away.',
    },
    staffContactMethod: 'whatsapp',
  },
  booking: {
    sources: ['direct', 'airbnb', 'booking'],
    paymentStatusAware: true,
    documentSupport: {
      menus: true,
      invoices: true,
    },
  },
}
