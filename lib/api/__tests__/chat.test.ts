import test from 'node:test'
import assert from 'node:assert/strict'
import { ChatApiError, parseChatRequestBody } from '../chat.ts'

test('parseChatRequestBody parses minimal valid payload', () => {
  const payload = parseChatRequestBody({ hotelId: 'grand-hotel', message: 'Hi there' })

  assert.deepEqual(payload, {
    hotelId: 'grand-hotel',
    message: 'Hi there',
    history: [],
    guestContext: undefined,
  })
})

test('parseChatRequestBody rejects invalid history with explicit diagnostics', () => {
  assert.throws(
    () => parseChatRequestBody({ hotelId: 'grand-hotel', message: 'Hi', history: [{ role: 'system', content: 'x' }] }),
    (error: unknown) => {
      assert.ok(error instanceof ChatApiError)
      assert.equal(error.code, 'INVALID_HISTORY')
      assert.equal(error.status, 400)
      assert.deepEqual(error.details, { field: 'history' })
      return true
    }
  )
})

test('parseChatRequestBody rejects invalid guest context', () => {
  assert.throws(
    () => parseChatRequestBody({ hotelId: 'grand-hotel', message: 'Hi', guestContext: { name: '', stayNights: -1 } }),
    ChatApiError
  )
})
