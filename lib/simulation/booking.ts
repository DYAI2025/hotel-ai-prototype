export type SimulatedBooking = {
  salutation: string
  firstName: string
  lastName: string
  roomType: string
  roomNumber: string
  checkIn: string
  checkOut: string
  checkInTime: string
  checkOutTime: string
  nights: number
  bookingRef: string
  includesBreakfast: boolean
  ratePerNight: number
  totalAmount: number
}

export const simulatedBooking: SimulatedBooking = {
  salutation: 'Herr',
  firstName: 'Thomas',
  lastName: 'Müller',
  roomType: 'Deluxe Doppelzimmer',
  roomNumber: '412',
  checkIn: '30. März 2026',
  checkOut: '2. April 2026',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  nights: 3,
  bookingRef: 'GHV-2026-0412',
  includesBreakfast: false,
  ratePerNight: 320,
  totalAmount: 960,
}
