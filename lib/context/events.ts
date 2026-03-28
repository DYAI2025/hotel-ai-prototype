export type LocalEvent = {
  name: string
  date: string
  description: string
}

export function getMockLocalEvents(city: string): LocalEvent[] {
  return [
    {
      name: 'Vienna Philharmonic Concert',
      date: 'Today, 19:30',
      description: 'Concert at the Musikverein. Tickets likely sold out — enquire at concierge.',
    },
  ]
}
