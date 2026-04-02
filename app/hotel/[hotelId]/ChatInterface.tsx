'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/app/api/chat/route'

type Props = {
  hotelId: string
  hotelName: string
  guestName?: string
  roomNumber?: string
}

type DisplayMessage = ChatMessage & {
  escalationLevel?: number
  handoff?: boolean
}

export default function ChatInterface({ hotelId, hotelName, guestName, roomNumber }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: 'assistant',
      content: guestName
        ? `Willkommen, ${guestName}. Wie kann ich Ihnen behilflich sein?`
        : `Welcome to ${hotelName}. How may I assist you today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const history: ChatMessage[] = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    const userMsg: DisplayMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          message: text,
          history,
          guestContext: guestName && roomNumber ? { name: guestName, room: roomNumber } : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          escalationLevel: data.escalationLevel,
          handoff: data.handoff,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologise — there was a technical issue. Please try again or contact the front desk.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-neutral-800 text-white rounded-br-sm'
                  : msg.handoff
                  ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm'
                  : msg.escalationLevel === 2
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm'
                  : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.handoff && (
                <p className="mt-2 text-xs text-red-500 font-medium">
                  Staff member notified
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            className="flex-1 resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-neutral-50 min-h-[44px] max-h-[140px]"
            placeholder="Type your message…"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="shrink-0 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-300 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-neutral-400 mt-2">
          {hotelName} — Digital Concierge
        </p>
      </div>
    </div>
  )
}
