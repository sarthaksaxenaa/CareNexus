# Changelog

All notable changes to CareNexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
