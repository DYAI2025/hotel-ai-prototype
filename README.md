# Hotel AI Prototype

Next.js prototype for a hotel concierge assistant with a domain-specific knowledge base, response post-processing, and escalation detection.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Core architecture (where CI/CD protection is most important)

The following areas are sensitive and therefore covered by automated checks:

1. **Request parsing and validation** (`lib/api/chat.ts`)  
   Invalid payloads must fail fast with clear error codes.
2. **Knowledge base loading** (`lib/knowledge-base/loader.ts`)  
   Wrong hotel IDs must fail deterministically so routing and prompts stay reliable.
3. **AI response post-processing** (`lib/post-processor.ts`)  
   Metadata extraction (`[META: ...]`) drives escalation/handoff logic and must stay stable.
4. **API error boundaries** (`app/api/chat/route.ts`)  
   All failures now return structured errors (`code`, `requestId`, optional `detail`) so incidents are traceable.

## Tests and local quality checks

```bash
npm run typecheck
npm run test
```

- `typecheck`: verifies TypeScript integrity for the complete app.
- `test`: runs deterministic Node test cases for core parsing, loader reliability, and metadata handling.

## CI/CD automation

GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline steps:
1. install dependencies (`npm ci`)
2. static check (`npm run typecheck`)
3. core regression tests (`npm run test`)

This guarantees that merges only pass when core concierge functionality remains intact.

## Error handling approach

### Goals
- **Clear user-facing failures** (useful message)
- **Stable machine-readable diagnostics** (`code`)
- **Developer traceability** (`requestId` + optional `detail`)

### Current behavior
- Input validation throws typed `ChatApiError` with:
  - HTTP status
  - error code
  - message
  - field-level details (when available)
- API route maps all known failures to structured JSON responses.
- Upstream AI failures include a request-scoped id to make logs and client reports correlate quickly.

## Maintainability notes

To keep the project maintainable over time:

- Keep business rules in small pure modules (`lib/...`) and test them directly.
- Keep route handlers thin (orchestration only).
- Add tests for every bugfix in parsing, mapping, or escalation logic.
- Prefer explicit error codes over ambiguous generic messages.

