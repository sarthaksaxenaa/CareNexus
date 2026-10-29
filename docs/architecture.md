# CareNexus — Architecture

## Overview

Two applications and one database:

```
 Browser
   │  Next.js 16 app (React 19, server-rendered shell, client pages)
   │  JWT in localStorage; silent refresh on 401
   ▼
 FastAPI service ── /api/v1/{auth, chat, health-profile, analytics}
   │   middleware: CORS → request logging (X-Request-ID, timing) → security headers
   │   per-route: auth dependency, rate limiter, input sanitiser
   ▼
 Services (auth, chat, profile, analytics, LLM)  ──►  Triage engine  ──►  RAG retriever
   │                                                       │                 │
   ▼                                                       ▼                 ▼
 SQLAlchemy 2 (async) ── SQLite file / PostgreSQL      emergency rules   TF-IDF index over
   users, health_profiles, chat_sessions, messages      symptom parser    49 conditions
   foreign keys + ON DELETE CASCADE enforced            optional Gemini   (in memory)
```

The backend is layered: **routes** validate input and handle HTTP, **services** hold business logic, **models** map tables. Routes never touch SQL directly.

## Request flow: one chat message

1. `POST /api/v1/chat/message` with a Bearer access token.
2. `get_current_user` verifies the JWT (type `access`), loads the user, rejects inactive accounts.
3. Rate limiter: 10 messages per minute **per user** (per-IP limits would make everyone behind one campus NAT share a quota).
4. Sanitiser strips HTML and refuses 12 prompt-injection patterns (400 with a reason).
5. The session is loaded (must belong to the caller, else 404) or created; the user message is stored and the session's `updated_at` bumped.
6. The caller's health profile supplies age, sex and known conditions.
7. `analyze_symptoms`:
   - **Emergency rules** run first; a match returns `red` immediately.
   - The **symptom parser** extracts body parts, duration and severity words.
   - **Risk factors** come from the profile.
   - The **retriever** returns the three closest conditions.
   - With `GEMINI_API_KEY`, the LLM writes the reply grounded in those conditions; on any LLM error, or with no key, the **offline engine** builds it from the top match, adjusting the level for duration, number of matched symptoms and risk factors.
8. The assistant message is stored with its level and sources; both messages are returned with UTC timestamps.

## Retrieval

Dependency-free TF-IDF with cosine similarity, built in memory at start-up (sub-millisecond queries).

- **Indexed fields** describe the patient's experience only: name and aliases (weight 3), symptoms (2), description and red flags (1). Advice text such as "go to the emergency room" is excluded; indexing it made everyday words match the wrong condition.
- **Normalisation:** lower-casing, stop words (including conversational filler), light suffix stemming applied identically to index and query.
- **Synonyms** map colloquial phrases to clinical terms ("throwing up" → vomiting, "room spins" → vertigo) before stemming.
- **Quality gate:** `backend/tests/data/retrieval_eval.json` (43 queries) and `retrieval_heldout.json` (15 queries written before tuning). CI requires ≥ 85% / ≥ 90% correct first results and 100% in the top three.

## Authentication

- Passwords: SHA-256 pre-hash, then bcrypt (`sha256$` prefix). Plain-bcrypt hashes from earlier versions still verify and are re-hashed at the next successful login.
- Access token 30 minutes, refresh token 7 days, HS256. Each carries a `type` claim so one can never be used as the other.
- `POST /auth/refresh` takes the refresh token in the JSON body (never the URL), is rate-limited, and re-checks that the user exists and is active.
- The frontend refreshes once on any 401 (shared by concurrent requests) and replays the request; if that fails it clears the session and goes to `/login`.

## Data model

| Table | Key columns | Notes |
|---|---|---|
| `users` | id (UUID), email (unique, stored lower-case), hashed_password, is_active | |
| `health_profiles` | user_id → users (CASCADE) | blood group validated against the eight groups |
| `chat_sessions` | user_id → users (CASCADE), title, updated_at | `updated_at` = latest message, used for ordering |
| `messages` | session_id → chat_sessions (CASCADE), role, content, triage_level, sources | |

Timestamps are stored as naive UTC and serialised with an explicit offset. Tables are created at start-up (`create_all`); there are no migrations yet, so schema changes require a fresh database.

## Frontend

- App Router pages: `/`, `/chat`, `/dashboard`, `/profile`, `/about`, `/login`, `/register`, plus a themed 404.
- Design tokens live in `src/app/globals.css` (`@theme`); shared class strings in `src/lib/styles.ts`; triage colours and labels in `src/lib/triage.ts`. Fonts (Cormorant Garamond, Jost) are self-hosted npm packages, so builds work offline.
- The 3D body map is lazy-loaded (`next/dynamic`, `ssr: false`) and falls back to an accessible list when WebGL is missing, the GPU context is lost, or reduced motion is preferred.
- Browser-only state (auth) is read after mount to keep server and client HTML identical.

## Configuration

All settings come from environment variables (`backend/.env`), with safe defaults for local use: SQLite, no LLM, development secret. With `ENVIRONMENT=production` the app refuses to start unless `SECRET_KEY` is set to a unique 32+ character value. `TRUST_PROXY_HEADERS` must only be enabled behind a reverse proxy that sets `X-Forwarded-For`.

## Testing and delivery

| Layer | Tooling | Scope |
|---|---|---|
| Backend | pytest (async), in-memory SQLite | units, API contracts, security, edge cases, DB integrity, retrieval quality |
| Frontend | Vitest | API client (refresh, errors), time parsing, body-map logic |
| End to end | Playwright | production build + real API + SQLite in Chromium |

GitHub Actions runs every layer plus `pip-audit` and `npm audit` on each push; Dependabot proposes weekly dependency updates that must pass the same pipeline. Docker images: Python 3.12 slim (non-root, SQLite in a volume) and a Next.js standalone server.
