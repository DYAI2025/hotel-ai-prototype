import { getHotelConfig } from '@/lib/hotels'
import { notFound } from 'next/navigation'
import { simulatedBooking } from '@/lib/simulation/booking'
import GuestJourney from './GuestJourney'

type Props = {
  params: Promise<{ hotelId: string }>
}

export default async function HotelPage({ params }: Props) {
  const { hotelId } = await params
  const hotel = getHotelConfig(hotelId)
  if (!hotel) notFound()

  const sportFacilities = Object.entries(hotel.facilities)
    .filter(([, f]) => f.available)
    .map(([key, f]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      hours: f.hours,
    }))

  return (
    <main className="flex flex-col h-screen bg-neutral-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Concierge</p>
          <h1 className="text-lg font-semibold text-neutral-800 leading-tight">{hotel.name}</h1>
        </div>
        <span className="text-xs text-neutral-400 font-mono">AI Concierge</span>
      </header>
      <GuestJourney
        hotelId={hotelId}
        hotelName={hotel.name}
        booking={simulatedBooking}
        localArea={hotel.localArea}
        events={hotel.events}
        sportFacilities={sportFacilities}
      />
    </main>
  )
}
