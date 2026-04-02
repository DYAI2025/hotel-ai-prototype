'use client'

import { useState } from 'react'
import type { SimulatedBooking } from '@/lib/simulation/booking'
import type { LocalTip, HotelEvent } from '@/lib/knowledge-base/types'
import ChatInterface from './ChatInterface'

type SportFacility = { name: string; hours: string }

type Props = {
  hotelId: string
  hotelName: string
  booking: SimulatedBooking
  localArea: LocalTip[]
  events: HotelEvent[]
  sportFacilities: SportFacility[]
}

const PHASES = [
  { label: 'T-1 · Vor dem Check-In', date: '29. März 2026' },
  { label: 'Check-In Tag', date: '30. März 2026' },
  { label: 'Aufenthalt', date: '30. Mär – 2. Apr' },
]

export default function GuestJourney({ hotelId, hotelName, booking, localArea, events, sportFacilities }: Props) {
  const [phase, setPhase] = useState(0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PhaseStepper current={phase} onChange={setPhase} />

      {phase < 2 ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            {phase === 0 && (
              <>
                <BookingConfirmationCard booking={booking} hotelName={hotelName} />
                <WhatsAppMessageCard booking={booking} hotelName={hotelName} />
                <InstagramMessageCard booking={booking} />
              </>
            )}
            {phase === 1 && (
              <CheckInDayPhase
                booking={booking}
                hotelName={hotelName}
                localArea={localArea}
                events={events}
                sportFacilities={sportFacilities}
              />
            )}
          </div>
          <div className="border-t border-neutral-200 bg-white px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              {phase === 0 ? '1 Tag vor Check-In' : `Check-In heute ab ${booking.checkInTime} Uhr`}
            </p>
            <button
              onClick={() => setPhase((p) => p + 1)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-xl px-6 py-2.5 transition-colors"
            >
              Weiter →
            </button>
          </div>
        </>
      ) : (
        <ChatInterface
          hotelId={hotelId}
          hotelName={hotelName}
          guestName={booking.firstName}
          roomNumber={booking.roomNumber}
        />
      )}
    </div>
  )
}

// ─── Phase Stepper ────────────────────────────────────────────────────────────

function PhaseStepper({ current, onChange }: { current: number; onChange: (i: number) => void }) {
  return (
    <div className="bg-white border-b border-neutral-200 px-4 py-3">
      <div className="flex items-center">
        {PHASES.map((phase, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => onChange(i)} className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  i < current
                    ? 'bg-neutral-400 text-white'
                    : i === current
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {i < current ? '✓' : i + 1}
              </span>
              <div className="hidden sm:block text-left min-w-0">
                <p className={`text-xs font-medium truncate ${i === current ? 'text-neutral-800' : 'text-neutral-400'}`}>
                  {phase.label}
                </p>
                <p className="text-[10px] text-neutral-400">{phase.date}</p>
              </div>
            </button>
            {i < PHASES.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 ${i < current ? 'bg-neutral-400' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Phase 0: Buchungsbestätigung (E-Mail) ────────────────────────────────────

function BookingConfirmationCard({ booking, hotelName }: { booking: SimulatedBooking; hotelName: string }) {
  const details: [string, string][] = [
    ['Buchungsnummer', booking.bookingRef],
    ['Zimmertyp', booking.roomType],
    ['Zimmernummer', booking.roomNumber],
    ['Check-in', `${booking.checkIn}, ab ${booking.checkInTime} Uhr`],
    ['Check-out', `${booking.checkOut}, bis ${booking.checkOutTime} Uhr`],
    ['Aufenthaltsdauer', `${booking.nights} Nächte`],
    ['Preis pro Nacht', `€ ${booking.ratePerNight},-`],
    ['Gesamtbetrag', `€ ${booking.totalAmount},-`],
    ['Frühstück', booking.includesBreakfast ? 'Inklusive' : 'Nicht inbegriffen (ab € 28 p. P.)'],
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-800 px-5 py-4">
        <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-0.5">E-Mail · Buchungsbestätigung</p>
        <h3 className="text-white font-semibold text-base">{hotelName}</h3>
      </div>

      <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 space-y-0.5">
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-600 w-12 inline-block">Von</span>
          concierge@grandhotelvienna.com
        </p>
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-600 w-12 inline-block">An</span>
          {booking.firstName.toLowerCase()}.{booking.lastName.toLowerCase()}@email.com
        </p>
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-600 w-12 inline-block">Betreff</span>
          Ihre Buchungsbestätigung – Ref. {booking.bookingRef}
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-neutral-700">
          Sehr geehrte{booking.salutation === 'Herr' ? 'r' : ''} {booking.salutation} {booking.lastName},
        </p>
        <p className="text-sm text-neutral-600 leading-relaxed">
          wir freuen uns, Ihren Aufenthalt im {hotelName} bestätigen zu dürfen. Nachfolgend finden Sie alle Details zu
          Ihrer Reservierung.
        </p>

        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Buchungsdetails</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {details.map(([label, value]) => (
              <div key={label} className="flex px-4 py-2.5 gap-4">
                <span className="text-xs text-neutral-500 w-36 flex-shrink-0">{label}</span>
                <span className="text-xs text-neutral-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-50 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Im Zimmerpreis inbegriffen
          </p>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="text-neutral-400">✓</span> Kostenloses WLAN im gesamten Hotel
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-neutral-400">✓</span> Zugang zu Fitnesscenter und Hallenbad
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-neutral-400">✓</span> 24-Stunden-Concierge-Service
            </li>
          </ul>
        </div>

        <p className="text-sm text-neutral-600 leading-relaxed">
          Sollten Sie Fragen haben oder besondere Wünsche für Ihren Aufenthalt, stehen wir Ihnen jederzeit gerne zur
          Verfügung.
        </p>

        <p className="text-sm text-neutral-700">
          Mit freundlichen Grüßen
          <br />
          <span className="font-medium">Das Concierge-Team</span>
          <br />
          <span className="text-neutral-400 text-xs">{hotelName}</span>
        </p>
      </div>
    </div>
  )
}

// ─── Phase 0: WhatsApp Willkommensnachricht ───────────────────────────────────

function WhatsAppMessageCard({ booking, hotelName }: { booking: SimulatedBooking; hotelName: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">GH</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{hotelName}</p>
          <p className="text-white/70 text-xs">WhatsApp · Offizielle Nachricht</p>
        </div>
      </div>
      <div className="bg-[#E5DDD9] px-4 py-4 space-y-3">
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
            <p className="text-sm text-neutral-800 leading-relaxed">
              Guten Abend, {booking.salutation} {booking.lastName} 👋
            </p>
            <p className="text-sm text-neutral-800 leading-relaxed mt-1">
              Wir freuen uns auf Ihren morgigen Besuch im {hotelName}. Zimmer {booking.roomNumber} wartet bereits auf
              Sie — Check-in ist ab {booking.checkInTime} Uhr möglich.
            </p>
            <p className="text-sm text-neutral-800 leading-relaxed mt-1">
              Bei früherer Ankunft bewahren wir Ihr Gepäck selbstverständlich gerne auf. Gibt es etwas, womit wir Sie
              im Voraus unterstützen dürfen?
            </p>
            <p className="text-[11px] text-neutral-400 text-right mt-1.5">18:42 ✓✓</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-4 py-2 shadow-sm max-w-[70%]">
            <p className="text-sm text-neutral-800">Danke, freue mich sehr! 🙏</p>
            <p className="text-[11px] text-neutral-400 text-right mt-1">18:51 ✓✓</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phase 0: Instagram Aufmerksamkeitsnachricht ──────────────────────────────

function InstagramMessageCard({ booking }: { booking: SimulatedBooking }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-neutral-200">
      <div className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">GH</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">grandhotelvienna</p>
          <p className="text-white/70 text-xs">Instagram · Direktnachricht</p>
        </div>
      </div>
      <div className="bg-white px-4 pt-4 pb-4">
        {/* Simulated story preview */}
        <div className="rounded-xl overflow-hidden border border-neutral-100 mb-4">
          <div className="h-28 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-600 flex items-end p-3">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest">Wien · Austria</p>
              <p className="text-white font-semibold text-sm">Grand Hotel Vienna</p>
            </div>
          </div>
          <div className="bg-neutral-50 px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-neutral-500">📸 Story von grandhotelvienna</p>
            <p className="text-[10px] text-neutral-400">gestern</p>
          </div>
        </div>
        {/* DM thread */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#833AB4] to-[#F77737] flex-shrink-0" />
            <div className="bg-neutral-100 rounded-2xl rounded-tl-none px-3 py-2.5 max-w-[80%]">
              <p className="text-sm text-neutral-800 leading-relaxed">
                Morgen sehen wir uns ✨ Zimmer {booking.roomNumber} ist bereits für Sie reserviert. Wir freuen uns auf
                Sie, {booking.firstName}!
              </p>
              <p className="text-[10px] text-neutral-400 mt-1">gestern 20:15</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-[#833AB4] to-[#FD1D1D] rounded-2xl rounded-tr-none px-3 py-2.5 max-w-[70%]">
              <p className="text-sm text-white">Freue mich riesig! 🙌</p>
              <p className="text-[10px] text-white/60 mt-1">gestern 20:18</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phase 1: Check-In Tag ────────────────────────────────────────────────────

function CheckInDayPhase({
  booking,
  hotelName,
  localArea,
  events,
  sportFacilities,
}: {
  booking: SimulatedBooking
  hotelName: string
  localArea: LocalTip[]
  events: HotelEvent[]
  sportFacilities: SportFacility[]
}) {
  const restaurants = localArea.filter((l) => l.category === 'restaurant')
  const attractions = localArea.filter((l) => l.category === 'attraction')
  const outdoor = localArea.filter((l) => l.category === 'tip')

  return (
    <div className="space-y-5">
      {/* Morning message */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">GH</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{hotelName}</p>
            <p className="text-white/70 text-xs">WhatsApp · Check-In Tag</p>
          </div>
        </div>
        <div className="bg-[#E5DDD9] px-4 py-4">
          <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[90%]">
            <p className="text-sm text-neutral-800 leading-relaxed">
              Guten Morgen, {booking.salutation} {booking.lastName}! ☀️
            </p>
            <p className="text-sm text-neutral-800 leading-relaxed mt-1">
              Herzlich willkommen in Wien. Zimmer {booking.roomNumber} ist für Sie bereit — Check-in ab{' '}
              {booking.checkInTime} Uhr. Wir haben ein paar Tipps für Ihren ersten Tag in der Stadt zusammengestellt 👇
            </p>
            <p className="text-[11px] text-neutral-400 text-right mt-1.5">08:30 ✓✓</p>
          </div>
        </div>
      </div>

      {restaurants.length > 0 && (
        <RecommendationSection
          icon="🍽️"
          title="Restaurants in der Nähe"
          items={restaurants.map((r) => ({ name: r.name, subtitle: r.description, badge: r.distance }))}
        />
      )}

      {attractions.length > 0 && (
        <RecommendationSection
          icon="🏛️"
          title="Sehenswürdigkeiten & Kultur"
          items={attractions.map((a) => ({ name: a.name, subtitle: a.description, badge: a.distance }))}
        />
      )}

      {events.length > 0 && (
        <RecommendationSection
          icon="🎭"
          title="Events & Abendprogramm"
          items={events.map((e) => ({ name: e.name, subtitle: `${e.description} · ${e.location}`, badge: e.time }))}
        />
      )}

      {outdoor.length > 0 && (
        <RecommendationSection
          icon="🌿"
          title="Parks & Outdoor"
          items={outdoor.map((o) => ({ name: o.name, subtitle: o.description, badge: o.distance }))}
        />
      )}

      {sportFacilities.length > 0 && (
        <RecommendationSection
          icon="💪"
          title="Sport & Wellness im Hotel"
          items={sportFacilities.map((s) => ({
            name: s.name,
            subtitle: `Geöffnet ${s.hours}`,
            badge: 'Im Haus',
          }))}
        />
      )}
    </div>
  )
}

function RecommendationSection({
  icon,
  title,
  items,
}: {
  icon: string
  title: string
  items: { name: string; subtitle: string; badge?: string }[]
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
        <span>{icon}</span>
        <h4 className="text-sm font-semibold text-neutral-700">{title}</h4>
      </div>
      <div className="divide-y divide-neutral-50">
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-neutral-800">{item.name}</p>
              {item.badge && (
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
