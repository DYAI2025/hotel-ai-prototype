import test from 'node:test'
import assert from 'node:assert/strict'
import { postProcess } from '../post-processor.ts'

test('postProcess extracts metadata and strips control tag', () => {
  const response = 'Absolutely, breakfast is served from 07:00 to 10:30.\n[META: intent=question, escalation=none, language=en]'
  const result = postProcess(response)

  assert.equal(result.cleanText, 'Absolutely, breakfast is served from 07:00 to 10:30.')
  assert.deepEqual(result.metadata, {
    intent: 'question',
    escalation: 'none',
    language: 'en',
  })
})

test('postProcess keeps safe defaults when metadata is missing', () => {
  const result = postProcess('Welcome to Grand Hotel Vienna!')

  assert.deepEqual(result.metadata, {
    intent: 'question',
    escalation: 'none',
    language: 'en',
  })
})
