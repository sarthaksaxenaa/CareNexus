# CareNexus — System Architecture

## Overview
CareNexus follows a modular, layered architecture designed for scalability, maintainability, and deployment flexibility.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Landing     │  │  Auth Pages  │  │  Chat Interface       │  │
│  │  Page        │  │  Login/Reg   │  │  + Triage Badges      │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│                    Next.js 14 (App Router)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Application                                       │ │
│  │  ├── CORS Middleware                                       │ │
│  │  ├── Request Logging Middleware (X-Request-ID, timing)     │ │
│  │  ├── Security Headers Middleware (XSS, CSRF, clickjack)   │ │
│  │  └── Global Exception Handlers                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────────┐ │
│  │ /auth/*  │ │ /chat/*  │ │/health-profile│ │  /health     │ │
│  │ register │ │ message  │ │ CRUD          │ │  check       │ │
│  │ login    │ │ sessions │ │               │ │              │ │
│  │ me       │ │ history  │ │               │ │              │ │
│  │ refresh  │ │          │ │               │ │              │ │
│  └──────────┘ └──────────┘ └───────────────┘ └──────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    SERVICE LAYER                                │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────────────┐│
│  │ Auth       │ │ Chat         │ │ Health Profile             ││
│  │ Service    │ │ Service      │ │ Service                    ││
│  │ ─ bcrypt   │ │ ─ sessions   │ │ ─ CRUD                    ││
│  │ ─ JWT      │ │ ─ messages   │ │ ─ medical data            ││
│  └────────────┘ └──────┬───────┘ └────────────────────────────┘│
│                        │                                        │
│  ┌─────────────────────▼──────────────────────────────────────┐│
│  │              TRIAGE ENGINE                                  ││
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  ││
│  │  │ Red Flag       │  │ LLM Analyzer   │  │ Rule-based   │  ││
│  │  │ Detector       │  │ (OpenAI/Gemini)│  │ Fallback     │  ││
│  │  │ 6 emergency    │  │ Structured JSON│  │ Keyword      │  ││
│  │  │ categories     │  │ response parse │  │ triage       │  ││
│  │  └────────────────┘  └────────────────┘  └──────────────┘  ││
│  └────────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ PostgreSQL   │  │ Redis        │  │ ChromaDB (planned)    │ │
│  │ ─ Users      │  │ ─ Caching    │  │ ─ Medical knowledge   │ │
│  │ ─ Sessions   │  │ ─ Rate limit │  │ ─ Vector embeddings   │ │
│  │ ─ Messages   │  │ ─ Sessions   │  │ ─ RAG retrieval       │ │
│  │ ─ Profiles   │  │              │  │                       │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (Next.js 14)
- Server-side rendered React application with App Router
- **Pages**: Landing, Login, Register, Chat, Health Profile, About
- Chat interface with real-time triage badges (🟢🟡🔴)
- TypeScript API client with JWT token management

### Backend API (FastAPI)
- RESTful API with JWT authentication (bcrypt + python-jose)
- Request validation with Pydantic V2
- Async request handling with uvicorn + asyncpg
- Structured logging with correlation IDs
- Security headers middleware (XSS, CSRF, clickjacking protection)
- Global exception handling with structured JSON error responses

### Triage Engine
- **Red-Flag Detection**: 6 emergency categories (cardiac, breathing, stroke, mental health, seizure, bleeding)
- **LLM Integration**: OpenAI GPT and Google Gemini with structured JSON responses
- **Rule-based Fallback**: Keyword-based triage when no API keys configured
- **Medical System Prompt**: Strict guidelines preventing diagnosis and prescription

### Data Layer
- **PostgreSQL**: Users, health profiles, chat sessions, messages (SQLAlchemy 2.0 async ORM)
- **Redis** (planned): Caching, rate limiting, session management
- **ChromaDB** (planned): Medical knowledge vector embeddings for RAG

## Data Flow
1. User sends symptom description via chat UI
2. Frontend sends POST to `/api/v1/chat/message` with JWT Bearer token
3. Backend validates auth, creates/retrieves session
4. Triage engine checks for red-flag emergencies first
5. If no red flag: LLM analyzes symptoms (or fallback if no API key)
6. Response parsed for triage level (green/yellow/red/none)
7. Both user message and AI response persisted to database
8. Response returned with severity badge, sources, and medical disclaimer

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create account | ❌ |
| POST | `/api/v1/auth/login` | Login | ❌ |
| GET | `/api/v1/auth/me` | Current user | ✅ |
| POST | `/api/v1/auth/refresh` | Refresh token | ❌ |
| POST | `/api/v1/chat/message` | Send message | ✅ |
| GET | `/api/v1/chat/sessions` | List sessions | ✅ |
| GET | `/api/v1/chat/sessions/{id}/messages` | Session history | ✅ |
| GET | `/api/v1/health-profile/` | Get profile | ✅ |
| POST | `/api/v1/health-profile/` | Create profile | ✅ |
| PUT | `/api/v1/health-profile/` | Update profile | ✅ |
| DELETE | `/api/v1/health-profile/` | Delete profile | ✅ |
| GET | `/health` | Health check | ❌ |
