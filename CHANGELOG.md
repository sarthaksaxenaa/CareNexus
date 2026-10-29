# Changelog

All notable changes to CareNexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-10-30

### Added
- Editorial interface: Cormorant Garamond and Jost (self-hosted), jet black and royal amethyst palette, redesigned pages, themed 404 page
- Interactive 3D body map with an accessible list fallback
- Playwright end-to-end suite (26 tests) running in CI against a production build, the real API and a database
- Retrieval quality gate: 43 labelled and 15 held-out queries, with `scripts/eval_retrieval.py`
- CI: dependency audits (pip-audit, npm audit), coverage floor of 90%, deprecations as errors, Dependabot
- One-command start (`run.py`, `start.ps1`) that installs changed dependencies

### Changed
- Retrieval indexes symptom fields only, with field weights and stemming: correct first result 62.8% → 86.0% (held-out 73.3% → 93.3%)
- Chat rate limit is per user instead of per IP
- Health profile updates: a field sent as null is cleared
- SQLite is the default database; `postgres://` URLs are accepted
- Answers are plain text without emoji

### Fixed
- Security: bcrypt 72-byte truncation (passwords now SHA-256 pre-hashed), spoofable `X-Forwarded-For` bypass of rate limits, shared rate-limit buckets, refresh token in the URL, deactivated users could refresh tokens
- Dependencies with published advisories: Next.js (critical RCE), Starlette, PyJWT, python-multipart, python-dotenv, Vitest, pytest
- Expired sessions showed "Invalid or expired token" instead of renewing or signing out
- Timestamps were shown 5 h 30 off for users in India (missing UTC offset)
- Errors displayed as "[object Object]"
- Duplicate e-mail with different case returned 500; malformed token subject returned 500
- Foreign keys and cascades were not enforced on SQLite
- Session list was not ordered by latest activity
- Docker images and compose stack did not build; `gemini-2.0-flash` (retired) was the default model

### Removed
- Placeholder deployment workflow that only printed text
- Unused Redis and ChromaDB services and settings

## [0.4.0] - 2026-10-19

### Added — Security Wiring
- **Rate Limiter Active**: Wired sliding window rate limiter into `/chat/message` (10 req/min) and `/auth/register` + `/auth/login` (5 req/min) — previously built but not connected
- **Input Sanitizer Active**: Wired XSS stripping + prompt injection guard into chat message handler — all user input now sanitized before processing
- **Shared Navbar Component**: Auth-aware, responsive navigation with active route highlighting, mobile icon fallback, and sticky blur backdrop

### Added — Edge-Case Test Suite
- **47 new tests** in `test_edge_cases.py` covering:
  - Red flag detection: Unicode, mixed-case, negated symptoms, extremely long input
  - Triage engine: Multi-symptom, emoji-only, greeting, malformed JSON, empty LLM responses
  - RAG retrieval: Empty queries, nonsense, SQL injection, special characters, medical term accuracy
  - Sanitizer: Nested HTML, zero-width chars, prompt injection variants, length boundaries
  - Rate limiter: Independent IPs, remaining count, reset, 429 response structure
  - API: Security headers, CORS preflight, 404/405 behavior, auth validation

### Fixed
- **API Client 204 Crash**: `api.ts` `request()` method now handles 204 No Content (DELETE responses) instead of crashing on `response.json()`
- **About Page Tech Stack**: Replaced inaccurate "LangChain, ChromaDB" with actual "TF-IDF RAG, FastAPI, SQLAlchemy"
- **Home Page Features**: Replaced "Multilingual" card (not yet built) with "RAG Pipeline" (actually built)
- **Duplicate Headers**: Replaced copy-pasted headers in Dashboard, Profile, and About with shared Navbar

### Changed
- **Test Count**: 110 → 152 tests passing (9 test files)
- **Version**: 0.3.0 → 0.4.0 in main.py, config.py, health check, README
- **Layout**: Added `scroll-smooth` and `antialiased` to root HTML layout

## [0.3.0] - 2026-10-19

### Added — RAG Pipeline
- **Medical Knowledge Base**: 20+ curated conditions across 7 categories (respiratory, cardiovascular, GI, neurological, musculoskeletal, dermatological, mental health) with ICD-11 codes
- **TF-IDF Vectorizer**: Lightweight, dependency-free symptom matching with cosine similarity and sub-millisecond query times
- **RAG Retriever**: Context builder with relevance scoring, anti-hallucination instructions, and structured LLM prompt augmentation
- **RAG-Enhanced Fallback**: Evidence-based responses with condition details, first aid, and red flags even without LLM

### Added — LLM Integration
- **LLM Service Abstraction**: Provider-agnostic interface with GeminiService and OpenAIService implementations
- **Retry with Backoff**: Exponential backoff (3 attempts) with jittered delays and rate limiting awareness
- **Structured Output Parsing**: Automatic JSON extraction from LLM responses (code blocks + inline)
- **LLM Configuration**: Startup validation, model selection, temperature/token settings in config

### Added — Enhanced Chat UX
- **Chat Sidebar**: Session history with message counts, relative timestamps, mobile-responsive drawer
- **Markdown Rendering**: Bold, italic, code, links, and lists in AI responses via MessageBubble component
- **Quick Actions**: 8 pre-built symptom prompts (Fever, Headache, Breathing, Stomach, Back Pain, Anxiety, Cold/Flu, Allergies)
- **Error Boundary**: Graceful error handling with retry button and ChatSkeleton loading state
- **Session Management**: New chat, session switching, message history loading

### Added — Security Hardening
- **Rate Limiting**: Sliding window per-IP rate limiter (10 req/min chat, 5 req/min auth, 20 req/min profile)
- **Input Sanitization**: XSS prevention with dangerous HTML tag detection and stripping
- **Prompt Injection Guard**: 12 regex patterns detecting instruction override, role hijacking, prompt extraction, and jailbreak markers
- **429 Responses**: Structured error detail with Retry-After header

### Added — Analytics Dashboard
- **Analytics API**: 5 endpoints — overview stats, triage distribution, daily usage, user stats, RAG index health
- **Analytics Service**: Aggregation queries for triage levels, daily message/session counts, averages
- **Dashboard Page**: Overview cards, triage distribution bars, 7-day activity chart, knowledge base stats

### Changed
- **Config**: Default LLM provider changed to Gemini (gemini-2.0-flash), added RAG and rate limit settings
- **Database**: SQLite+aiosqlite support for local development (auto-detect), PostgreSQL for production
- **Models**: Migrated from PostgreSQL-specific UUID to database-agnostic `Uuid()` (SQLAlchemy 2.0)
- **Triage Engine**: Integrated RAG context into LLM prompts and fallback responses
- **Prompts**: Updated system prompt with RAG reference instructions
- **API Client**: Made request method public for direct endpoint access

### Tests
- **110 tests passing** (up from 35) in <5 seconds
- Added 32 RAG tests (knowledge base integrity, vectorizer accuracy, retriever pipeline)
- Added 16 LLM service tests (retry logic, JSON parsing, provider init, error handling)
- Added 27 security tests (rate limiter, HTML sanitizer, prompt injection, full pipeline)

## [0.2.0] - 2026-10-11

### Added
- **Structured Logging**: Custom CareNexusFormatter with ANSI colors and UTC timestamps
- **Exception Handling**: Custom error hierarchy (AuthenticationError, AuthorizationError, ResourceNotFoundError, RateLimitError) with structured JSON responses
- **Request Middleware**: RequestLoggingMiddleware (correlation IDs, timing) and SecurityHeadersMiddleware (XSS, CSRF, clickjacking)
- **Health Profile**: Full CRUD API for user medical data (age, gender, blood group, conditions, medications, allergies)
- **Health Profile UI**: Frontend page with view/edit/create modes and form validation
- **Architecture Docs**: Comprehensive system diagram and API endpoint reference table
- **Test Suite Expansion**: 35 total tests (up from 19) covering JWT tokens, exceptions, middleware, triage

### Changed
- Version bumped to 0.2.0
- Main app now wires middleware stack, exception handlers, and structured logging in lifespan
- Removed stale `__future__` annotations from 12 backend modules

## [0.1.0] - 2026-10-10

### Added
- **Authentication System**: JWT-based signup/login with bcrypt password hashing, access/refresh tokens
- **Database Models**: User, HealthProfile, ChatSession, Message with SQLAlchemy 2.0 async ORM
- **Pydantic Schemas**: Request/response validation for auth and chat endpoints
- **Triage Engine**: AI-powered symptom analysis with red-flag detection for 6 emergency categories
- **LLM Integration**: Support for OpenAI GPT and Google Gemini with rule-based fallback
- **Chat Service**: Session management, message persistence, conversation history
- **Frontend Auth**: Login and registration pages with form validation
- **Connected Chat UI**: Real-time triage badges (🟢🟡🔴), source citations, loading states
- **API Client**: TypeScript client with JWT token management and error handling
- **Test Suite**: 19 tests covering health check, auth, triage engine, and red-flag detection

### Changed
- Upgraded from passlib to direct bcrypt for Python 3.13 compatibility
- Chat routes now require authentication and persist messages to database
- Version bumped to 0.1.0

## [0.0.1] - 2026-10-05

### Added
- Initial project scaffolding
- FastAPI backend with health check and placeholder routes
- Next.js frontend with landing page, chat UI, and about page
- Docker Compose setup (PostgreSQL, Redis, ChromaDB)
- CI/CD pipelines with GitHub Actions
- Project documentation (README, CONTRIBUTING, CHANGELOG)
- PR and issue templates
