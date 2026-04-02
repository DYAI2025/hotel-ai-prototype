# Hotel AI Concierge Prototype

Next.js + TypeScript prototype for a hotel concierge experience with AI-powered responses, deterministic escalation logic, and per-hotel configuration.

## Quick start

```bash
npm install
cp .env.example .env.local  # or set env vars directly
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

- `ANTHROPIC_API_KEY` — Anthropic API key for `/api/chat`
- `CHAT_TOKEN_SECRET` — HMAC secret used to sign/verify chat session tokens (minimum 16 chars)

Optional (for Supabase integration paths):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Quality checks

```bash
npx tsc --noEmit
CHAT_TOKEN_SECRET=dev_super_secret_key_123 npm run build
```

## Architecture (high level)

- `app/hotel/[hotelId]/*` — guest journey + chat UI
- `app/api/chat/route.ts` — secure chat orchestration endpoint
- `lib/knowledge-base/*` — typed hotel data + mapping
- `lib/ai/*` — interpretation, escalation decisions, proactive messaging
- `lib/security/*` — chat token verification + rate limiting
- `supabase/migrations/*` — database schema (future persistence expansion)
