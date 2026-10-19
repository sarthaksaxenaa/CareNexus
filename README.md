# CareNexus — Your First Point of Care 🏥

> AI-powered primary healthcare triage assistant with RAG-enhanced medical knowledge base, symptom analysis, and intelligent severity classification.

[![CI](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml/badge.svg)](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://python.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/Tests-152%20passing-green.svg)](#testing)

---

## ✨ Features

### Core Intelligence
- **RAG Pipeline** — 20+ curated medical conditions with TF-IDF retrieval (sub-ms queries)
- **Triage Engine** — Three-level severity classification (🟢 Green / 🟡 Yellow / 🔴 Red)
- **Red Flag Detection** — Instant emergency recognition for 6 critical categories
- **LLM Integration** — Google Gemini / OpenAI with retry, rate limiting, and structured output
- **Rule-Based Fallback** — RAG-enhanced responses when no LLM API key is configured

### Application
- **JWT Authentication** — Secure register/login with bcrypt, access + refresh tokens
- **Health Profile** — CRUD for patient medical history, allergies, medications
- **Chat Sessions** — Persistent conversation history with session management
- **Analytics Dashboard** — Triage distribution, usage trends, knowledge base stats
- **Quick Actions** — Pre-built symptom prompts for instant triage

### Engineering
- **152 Tests** — Unit, integration, edge-case, and security tests passing in <25s
- **Security Hardening** — Rate limiting + input sanitization wired into all routes
- **Structured Logging** — Color-coded, timestamped logs with request tracing
- **Custom Exceptions** — Typed error hierarchy with global handlers
- **CI/CD** — GitHub Actions pipeline (lint, type-check, test, build)
- **Database Agnostic** — SQLite (dev) + PostgreSQL (prod) via SQLAlchemy 2.0
- **Shared Navbar** — Auth-aware, responsive, active-state navigation across all pages

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │  Chat UI  │ │  Profile │ │ Dashboard │ │  Auth (Login/Reg) │  │
│  │ +Sidebar  │ │  CRUD    │ │ Analytics │ │  JWT + bcrypt     │  │
│  │ +Markdown │ │          │ │ + Charts  │ │                   │  │
│  └────┬──────┘ └────┬─────┘ └─────┬─────┘ └────────┬─────────┘  │
│       └──────────────┴─────────────┴────────────────┘            │
│                            REST API                               │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
┌────────────────────────────────┴──────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                    │
│                                                                    │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐  │
│  │  API Layer       │    │  Core Services                       │  │
│  │  /auth           │    │  ┌──────────┐  ┌──────────────────┐ │  │
│  │  /chat           │───▶│  │ Triage   │  │  LLM Service     │ │  │
│  │  /health-profile │    │  │ Engine   │──│  Gemini / OpenAI │ │  │
│  │  /analytics      │    │  └────┬─────┘  └──────────────────┘ │  │
│  └─────────────────┘    │       │                               │  │
│                          │  ┌────▼─────────────────────────────┐ │  │
│  ┌─────────────────┐    │  │  RAG Pipeline                    │ │  │
│  │  Security        │    │  │  Knowledge Base (20 conditions)  │ │  │
│  │  Rate Limiter    │    │  │  TF-IDF Vectorizer               │ │  │
│  │  Sanitizer       │    │  │  Retriever + Context Builder     │ │  │
│  │  Middleware       │    │  └──────────────────────────────────┘ │  │
│  └─────────────────┘    └──────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Data Layer (SQLAlchemy 2.0 + SQLite/PostgreSQL)            │    │
│  │  User │ HealthProfile │ ChatSession │ Message               │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git

### 1. Clone & Setup Backend
```bash
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows

# Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Configure environment
cp .env.example .env
# Edit .env — set GEMINI_API_KEY for AI responses (optional)

# Run backend
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install
cp .env.example .env.local

npm run dev
```

### 3. Open in Browser
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v

# 152 tests across 9 test files:
#   test_auth_service.py    —  7 tests (JWT tokens)
#   test_exceptions.py      —  5 tests (error handlers)
#   test_health.py          — 37 tests (endpoints + auth)
#   test_middleware.py       —  4 tests (security headers)
#   test_triage.py          — 13 tests (red flags + fallback)
#   test_rag.py             — 32 tests (knowledge base + vectorizer + retriever)
#   test_llm_service.py     — 16 tests (retry + JSON parsing + providers)
#   test_security.py        — 27 tests (rate limiter + sanitizer + injection)
#   test_edge_cases.py      — 47 tests (adversarial inputs, boundary values, API validation)
```

---

## 📋 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create account | ❌ |
| POST | `/api/v1/auth/login` | Login, get tokens | ❌ |
| GET | `/api/v1/auth/me` | Current user info | ✅ |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | ✅ |
| POST | `/api/v1/chat/message` | Send message, get AI response | ✅ |
| GET | `/api/v1/chat/sessions` | List chat sessions | ✅ |
| GET | `/api/v1/chat/sessions/{id}/messages` | Get session messages | ✅ |
| GET | `/api/v1/health-profile/` | Get health profile | ✅ |
| POST | `/api/v1/health-profile/` | Create health profile | ✅ |
| PUT | `/api/v1/health-profile/` | Update health profile | ✅ |
| DELETE | `/api/v1/health-profile/` | Delete health profile | ✅ |
| GET | `/api/v1/analytics/overview` | System statistics | ✅ |
| GET | `/api/v1/analytics/triage-distribution` | Triage level stats | ✅ |
| GET | `/api/v1/analytics/daily-usage` | Daily usage trends | ✅ |
| GET | `/api/v1/analytics/my-stats` | User's personal stats | ✅ |
| GET | `/api/v1/analytics/rag-index` | Knowledge base metrics | ✅ |

---

## 🩺 Medical Knowledge Base

CareNexus includes a curated knowledge base covering **20+ medical conditions** across **7 categories**:

| Category | Conditions | Example |
|----------|-----------|---------|
| Respiratory | 4 | Common Cold, Influenza, Asthma, Bronchitis |
| Cardiovascular | 2 | Chest Pain, Hypertension |
| Gastrointestinal | 3 | Gastroenteritis, Acid Reflux, Appendicitis |
| Neurological | 2 | Migraine, Tension Headache |
| Musculoskeletal | 2 | Lower Back Pain, Sprain/Strain |
| Dermatological | 2 | Allergic Reaction, Skin Infection |
| Mental Health | 2 | Anxiety, Depression |
| General | 3 | Fever, Dehydration, Diabetes Signs |

Each condition includes: symptoms, severity, red flags, first aid, when to seek help, and ICD-11 codes.

---

## 🔒 Security Features

- **Rate Limiting** — Sliding window per-IP (10 req/min chat, 5 req/min auth)
- **Input Sanitization** — XSS prevention, HTML stripping
- **Prompt Injection Guard** — 12 detection patterns for LLM safety
- **JWT Authentication** — HS256 with separate access/refresh tokens
- **Security Headers** — X-Content-Type-Options, X-Frame-Options, CSP-adjacent
- **CORS** — Configurable allowed origins

---

## 📁 Project Structure

```
CareNexus/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # REST endpoints (auth, chat, health-profile, analytics)
│   │   ├── core/                # Config, middleware, security, triage
│   │   │   └── triage/          # Triage engine, prompts, red flags
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── rag/                 # RAG pipeline
│   │   │   ├── knowledge_base.py   # 20+ curated medical conditions
│   │   │   ├── vectorizer.py       # TF-IDF with cosine similarity
│   │   │   └── retriever.py        # Context builder for LLM prompts
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Business logic services
│   └── tests/                   # 152 tests (9 test files)
├── frontend/
│   ├── src/app/                 # Next.js pages (chat, dashboard, profile, about, auth)
│   ├── src/components/          # Navbar, ChatSidebar, MessageBubble, QuickActions, ErrorBoundary
│   └── src/lib/                 # API client
├── docs/                        # Architecture documentation
├── .github/workflows/           # CI/CD pipeline
└── docker-compose.yml           # Container orchestration
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12+, SQLAlchemy 2.0, Pydantic V2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI/ML | Google Gemini API, TF-IDF vectorization, RAG pipeline |
| Auth | JWT (PyJWT), bcrypt |
| Testing | pytest, pytest-asyncio, httpx |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |

---

## ⚠️ Disclaimer

CareNexus is an **educational project** demonstrating AI-powered healthcare triage. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.

---

## 📄 License

[MIT License](LICENSE) — Built by [Sarthak Saxena](https://github.com/sarthaksaxenaa)

---

<!-- CHECKPOINT: v0.4.0 — Security Hardening & Testing. 2026-10-19.
152 tests passing (was 110). All security modules now WIRED into routes.
Completed in v0.4.0:
- Fixed api.ts 204 No Content crash (DELETE endpoint)
- Fixed about page incorrect tech stack (LangChain/ChromaDB → TF-IDF/FastAPI)
- Wired rate limiter into chat (10 req/min) and auth (5 req/min) routes
- Wired input sanitizer (XSS + prompt injection) into chat message handler
- Added 47 senior-level edge-case tests (red flags, triage, RAG, sanitizer, rate limiter, API)
- Added shared Navbar component (auth-aware, responsive, active states)
- Replaced duplicate headers in dashboard, profile, about pages with Navbar
- Updated home page feature cards to reflect actual tech (RAG Pipeline not Multilingual)
- Version bumped: 0.3.0 → 0.4.0

Previous checkpoints: v0.0.1 (scaffolding), v0.1.0 (auth/chat), v0.2.0 (middleware/health), v0.3.0 (RAG/Gemini/UX/security/analytics)
Next: merge to main, tag v0.4.0, push to GitHub -->
