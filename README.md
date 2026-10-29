# CareNexus

> A symptom-triage assistant. Describe what you feel; CareNexus says how urgently you should get care, and what to do in the meantime.

[![CI](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml/badge.svg)](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)

CareNexus does not diagnose. It grades a message into one of three levels and explains why:

| Level | Meaning |
|---|---|
| **Self-care** | Usually safe to manage at home, with signs to watch for |
| **See a doctor** | Should be examined in person soon |
| **Emergency** | Get help now |

It runs **fully offline**: a rules engine and a search over a curated medical library answer every message. A Gemini API key is optional and, when set, writes the reply from the same retrieved knowledge.

---

## Quick start

Requires **Python 3.12+** and **Node.js 20+**.

```bash
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus
python run.py          # Windows: double-click start.ps1
```

`run.py` creates the Python environment, installs dependencies whenever `requirements.txt` or `package-lock.json` changes, starts both servers and opens the browser.

| | URL |
|---|---|
| App | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

No configuration is needed. To use Gemini, copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`.

**With Docker:** `docker compose up --build`

---

## How a message is assessed

```
message ──► sanitise ──► emergency rules ──► parse symptoms ──► profile risk ──► retrieve ──► answer
            (HTML,        (6 warning-sign     (body parts,       (age, sex,       (top 3 of    (Gemini if
             prompt        groups; a match     duration,          known            49 ICD-10-   configured,
             injection)    ends here: RED)     severity words)    conditions)      coded        else rules)
                                                                                    conditions)
```

1. **Sanitise.** HTML is stripped; 12 prompt-injection patterns are refused.
2. **Emergency rules first.** Chest pain, stroke signs, breathing difficulty, unconsciousness, severe bleeding and self-harm are matched before anything else and answered immediately.
3. **Parse.** Body parts, duration ("for 9 days") and severity words are extracted.
4. **Profile.** Age, sex and known conditions from the user's health profile raise the level of concern.
5. **Retrieve.** TF-IDF search over the library with field weighting (name and aliases count most), light stemming and medical synonyms.
6. **Answer.** Gemini writes the reply grounded in the retrieved conditions, or the offline engine builds it.

### Measured retrieval accuracy

Labelled everyday-language queries, including every quick-start prompt (`python -m scripts.eval_retrieval` in `backend/`):

| Set | Queries | Correct first result | Correct in top 3 |
|---|---|---|---|
| Labelled | 43 | 86.0% | 100% |
| Held-out (written before tuning) | 15 | 93.3% | 100% |

CI fails if accuracy drops below these levels.

---

## Features

- **Chat** with saved conversations, quick-start symptoms and a **3D body map** (three.js) with an accessible list fallback
- **Health profile** that personalises triage
- **Dashboard** of how answers were graded and weekly activity
- **Accounts** with JWT access and refresh tokens, renewed silently when they expire

## Security

- Passwords: SHA-256 pre-hash + bcrypt (no 72-byte truncation); legacy hashes upgraded at login
- JWT (HS256) with separate access/refresh tokens; refresh re-checks the account is active
- Rate limits: 5/min per IP for auth, 10/min **per user** for chat; proxy headers trusted only when configured
- Input sanitising and prompt-injection refusal; HTML escaped again before rendering
- Foreign keys and cascades enforced by the database (including SQLite)
- The app refuses to start in production with the default JWT secret
- Dependencies audited in CI (`pip-audit`, `npm audit`); Dependabot opens weekly update PRs

**Known limitation:** tokens are kept in `localStorage`, which an XSS flaw could read. Production deployments should move them to `httpOnly` cookies.

---

## Testing

| Suite | Count | Command |
|---|---|---|
| Backend unit, API and integration | 361 | `cd backend && pytest` |
| Frontend unit | 34 | `cd frontend && npm test` |
| End-to-end (browser + API + database) | 26 | `cd frontend && npm run build && npm run e2e` |

Backend line coverage is 92% (CI floor 90%). Deprecation warnings fail the backend suite.

### Continuous integration

Every push runs: backend lint and format, backend tests with coverage, retrieval accuracy, dependency audits for both stacks, frontend lint, type check and unit tests, and the Playwright end-to-end suite against a production build.

---

## API

Interactive documentation: http://localhost:8000/docs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Create an account | – |
| POST | `/api/v1/auth/login` | Sign in, receive tokens | – |
| POST | `/api/v1/auth/refresh` | New token pair from `{"refresh_token": ...}` | – |
| GET | `/api/v1/auth/me` | Current user | Bearer |
| POST | `/api/v1/chat/message` | Send a message, receive a graded answer | Bearer |
| GET | `/api/v1/chat/sessions` | Past conversations, most recent activity first | Bearer |
| GET | `/api/v1/chat/sessions/{id}/messages` | Messages of one conversation | Bearer |
| GET / POST / PUT / DELETE | `/api/v1/health-profile/` | Health profile (PUT: null clears a field) | Bearer |
| GET | `/api/v1/analytics/overview` | Totals across the server | Bearer |
| GET | `/api/v1/analytics/my-stats` | The caller's own totals | Bearer |
| GET | `/api/v1/analytics/triage-distribution` | Answers per level | Bearer |
| GET | `/api/v1/analytics/daily-usage?days=1..90` | Messages per day | Bearer |
| GET | `/api/v1/analytics/rag-index` | Library size | Bearer |

All timestamps are UTC with an explicit offset.

---

## Project structure

```
CareNexus/
├── backend/
│   ├── app/
│   │   ├── api/routes/        auth, chat, health_profile, analytics
│   │   ├── core/              config, database, security middleware, rate limiter, sanitiser
│   │   │   └── triage/        engine, emergency rules, symptom parser, prompts
│   │   ├── rag/               knowledge base (49 conditions), vectoriser, synonyms, retriever
│   │   ├── models/            SQLAlchemy models
│   │   ├── schemas/           Pydantic request/response models
│   │   └── services/          auth, chat, profile, analytics, LLM
│   ├── scripts/               eval_retrieval.py
│   └── tests/                 pytest suites + labelled retrieval data
├── frontend/
│   ├── src/app/               pages: home, chat, dashboard, profile, about, login, register
│   ├── src/components/        navbar, chat sidebar, messages, 3D body map
│   ├── src/lib/               API client, design tokens, triage levels, helpers (+ unit tests)
│   └── e2e/                   Playwright end-to-end tests
├── docs/architecture.md
├── run.py, start.ps1          one-command start
└── docker-compose.yml
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, three.js / React Three Fiber |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic 2 |
| Database | SQLite (default), PostgreSQL (production) |
| Triage | Rules, TF-IDF retrieval, optional Google Gemini |
| Testing | pytest, Vitest, Playwright |
| Delivery | GitHub Actions, Docker |

---

## Disclaimer

CareNexus is a final-year capstone project. It gives general health information and is **not** a substitute for professional medical advice, diagnosis or treatment. In an emergency, call your local emergency number.

## License

[MIT](LICENSE) — built by [Sarthak Saxena](https://github.com/sarthaksaxenaa)
