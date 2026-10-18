# Changelog

All notable changes to CareNexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
