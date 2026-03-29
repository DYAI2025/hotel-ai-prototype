import type { HotelConfig } from '@/lib/knowledge-base/types'

export const grandHotel: HotelConfig = {
  id: 'grand-hotel',
  name: 'Grand Hotel Vienna',
  location: {
    city: 'Vienna',
    country: 'Austria',
    timezone: 'Europe/Vienna',
    coordinates: { lat: 48.2082, lng: 16.3738 },
  },
  contact: {
    phone: '+43 1 515 800',
    email: 'concierge@grandhotelvienna.com',
    whatsapp: '+43 1 515 800',
  },
  policies: {
    checkIn: '15:00',
    checkOut: '12:00',
    cancellation: 'Free cancellation up to 24 hours before arrival.',
    pets: 'Pets are not permitted.',
    smoking: 'The hotel is entirely non-smoking.',
  },
  wifi: { ssid: 'GrandHotel_Guest', password: 'welcome2024' },
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
      name: 'The Grand Restaurant',
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
      description: 'World-class art and antiquities museum in a stunning imperial building. One of the finest in Europe.',
      distance: '800m',
    },
    {
      category: 'attraction',
      name: 'Belvedere Palace & Gardens',
      description: 'Baroque palace complex with Klimt\'s The Kiss and beautiful formal gardens. Not to be missed.',
      distance: '1.5km',
    },
    {
      category: 'attraction',
      name: 'Vienna State Opera',
      description: 'One of the world\'s leading opera houses. Standing tickets available from €3 on performance nights.',
      distance: '600m',
    },
    {
      category: 'restaurant',
      name: 'Café Central',
      description: 'Vienna\'s most iconic coffeehouse, opened in 1876. Famous for Melange coffee and Apfelstrudel.',
      distance: '700m',
    },
    {
      category: 'restaurant',
      name: 'Figlmüller Bäckerstraße',
      description: 'Legendary Viennese restaurant famous for its enormous, perfectly breaded Wiener Schnitzel. Book ahead.',
      distance: '1.0km',
    },
    {
      category: 'restaurant',
      name: 'Steirereck im Stadtpark',
      description: 'Austria\'s best restaurant — two Michelin stars, modern Alpine cuisine in a beautiful park setting.',
      distance: '2.0km',
    },
    {
      category: 'transport',
      name: 'U-Bahn Karlsplatz',
      description: 'Nearest metro station, lines U1, U2, U4. Direct connections across the entire city.',
      distance: '400m',
    },
    {
      category: 'transport',
      name: 'Airport to Hotel',
      description: 'City Airport Train (CAT) runs every 30 minutes from Vienna Airport to Wien Mitte (16 min). Taxi takes 25–35 min, approx. €40.',
      distance: '18km from airport',
    },
    {
      category: 'tip',
      name: 'Naschmarkt',
      description: "Vienna's most famous open-air market with 120 stalls of fresh produce, spices, meats, cheeses, and street food. Open Mon–Sat from 06:00.",
      distance: '1.2km',
    },
    {
      category: 'tip',
      name: 'Prater & Riesenrad',
      description: 'The historic giant Ferris wheel and green parkland — perfect for an afternoon walk or a classic Viennese evening out.',
      distance: '3.5km',
    },
  ],
  faqs: [
    {
      question: 'Is parking available?',
      answer: 'Valet parking is available at €35 per night. Please inform the concierge upon arrival and our team will take care of your vehicle.',
    },
    {
      question: 'What is the check-in time?',
      answer: 'Check-in is from 15:00. Early check-in is subject to availability — please request it when you arrive and we will do our best. Luggage storage is always available from arrival.',
    },
    {
      question: 'What is included in the room rate?',
      answer: 'The room rate includes complimentary WiFi, access to the fitness centre and pool, and 24-hour concierge service. Breakfast is available at an additional charge.',
    },
    {
      question: 'Is there a spa?',
      answer: 'Yes, our spa is on level B1 and open 09:00–21:00. Treatments require advance booking. Suite guests enjoy complimentary spa access during their stay.',
    },
    {
      question: 'Can you help arrange tours or theatre tickets?',
      answer: 'Absolutely — our concierge team can arrange city tours, opera and theatre tickets, restaurant reservations, and private transfers. Just let us know what you have in mind.',
    },
    {
      question: 'What is the cancellation policy?',
      answer: 'Cancellations are free of charge up to 24 hours before your arrival date. Late cancellations or no-shows are charged one night\'s room rate.',
    },
    {
      question: 'Is the hotel pet-friendly?',
      answer: 'We do not accommodate pets at the hotel. We are happy to recommend pet-friendly accommodation nearby if needed.',
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
    humanHandoffMessage: 'I am connecting you with a member of our team now. They will be with you shortly.',
    staffContactMethod: 'whatsapp',
  },
}
