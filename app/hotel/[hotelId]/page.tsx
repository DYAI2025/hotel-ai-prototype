import { getHotelConfig } from '@/lib/hotels'
import { notFound } from 'next/navigation'
import ChatInterface from './ChatInterface'

type Props = {
  params: Promise<{ hotelId: string }>
}

export default async function HotelPage({ params }: Props) {
  const { hotelId } = await params
  const hotel = getHotelConfig(hotelId)
  if (!hotel) notFound()

  return (
    <main className="flex flex-col h-screen bg-neutral-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
            Curt AI Hotel (Prototype)
          </p>
          <h1 className="text-lg font-semibold text-neutral-800 leading-tight">{hotel.name}</h1>
        </div>
        <span className="text-xs text-neutral-400 font-mono">AI Concierge</span>
      </header>
      <ChatInterface hotelId={hotelId} hotelName={hotel.name} />
    </main>
  )
}
