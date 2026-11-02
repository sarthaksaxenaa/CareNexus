<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
  <img src="docs/assets/banner-light.svg" alt="CareNexus: a clearer kind of care. Three real assessments play in turn: a mild headache graded self-care, burning urination with fever graded see a doctor, crushing chest pain graded emergency." width="100%">
</picture>

<div align="center">

[![CI](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml/badge.svg)](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml)
[![README assets](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/readme-assets.yml/badge.svg)](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/readme-assets.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fcarenexus-health.vercel.app&label=live&up_message=online&up_color=3b0a6b&labelColor=050505)](https://carenexus-health.vercel.app)
[![Last commit](https://img.shields.io/github/last-commit/sarthaksaxenaa/CareNexus?color=3b0a6b&labelColor=050505)](https://github.com/sarthaksaxenaa/CareNexus/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-3b0a6b?labelColor=050505)](LICENSE)

### [Try it live → carenexus-health.vercel.app](https://carenexus-health.vercel.app)

<sub>Create an account in seconds; no AI key needed, the engine runs on its own. The API sleeps when idle, so the very first request can take up to a minute.</sub>

[What it does](#what-it-does) · [See it](#see-it) · [Run it](#run-it) · [Production](#production) · [Quality](#quality) · [How it decides](#how-a-message-is-assessed) · [Architecture](#architecture) · [Engineering](#engineering)

</div>

## What it does

CareNexus is a **triage** assistant. It does not name your illness; it answers the question that matters first: *how urgently should I get care?*

| Level | Meaning |
|:--|:--|
| 🟢 **Self-care** | Usually safe to manage at home, with clear signs to watch for |
| 🟠 **See a doctor** | Book an appointment soon; it should be examined in person |
| 🔴 **Emergency** | Get help now: call your local emergency number |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/features-dark.svg">
  <img src="docs/assets/features-light.svg" alt="Four principles. Emergencies first: six emergency categories checked before anything else. Grounded answers: a library of 49 ICD-10 conditions searched with TF-IDF. No AI key needed: runs fully offline. Tested like production: unit, API, browser and PostgreSQL suites on every push." width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/divider-dark.svg">
  <img src="docs/assets/divider-light.svg" alt="" width="100%">
</picture>

## See it

<p align="center">
  <img src="docs/assets/demo.gif" alt="Demo: a fever check graded 'see a doctor', a stroke description graded 'emergency', the 3D body map, and the dashboard" width="900">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/chat.png" alt="Chat: an emergency answer next to the 3D body map"><br><sub><b>Chat</b>: graded answers, saved conversations, a 3D body map with a list fallback</sub></td>
    <td width="50%"><img src="docs/assets/screenshots/home.png" alt="Home page"><br><sub><b>Home</b>: an editorial interface in jet black and royal amethyst</sub></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screenshots/dashboard.png" alt="Dashboard"><br><sub><b>Dashboard</b>: how answers were graded and weekly activity</sub></td>
    <td><img src="docs/assets/screenshots/profile.png" alt="Health profile"><br><sub><b>Health profile</b>: age, sex and conditions adjust the level of concern</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/screenshots/mobile-home.png" alt="Home on a phone" width="260">
  &nbsp;&nbsp;
  <img src="docs/assets/screenshots/mobile-chat.png" alt="Chat on a phone" width="260">
</p>

## Run it

Requires **Python 3.12+** and **Node.js 20+**.

```bash
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus
```

| Platform | Start |
|---|---|
| Windows | double-click **`start.cmd`** |
| macOS / Linux | `./start.sh` |
| Anywhere | `python run.py` &nbsp;·&nbsp; or `docker compose up --build` |

`run.py` creates the Python environment, installs dependencies only when `requirements.txt` or `package-lock.json` changed (it hashes them), starts both servers and opens **http://localhost:3000**. API docs are at **http://localhost:8000/docs**. No configuration needed; for Gemini-written answers, set `GEMINI_API_KEY` in `backend/.env`.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/divider-dark.svg">
  <img src="docs/assets/divider-light.svg" alt="" width="100%">
</picture>

## Production

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/status-dark.svg">
  <img src="docs/assets/status-light.svg" alt="Production status as probed by CI: API health and latency, CORS preflight from the web origin, and the web app." width="100%">
</picture>

<sub>Probed from GitHub Actions: 15 timed calls to the live API, a real CORS preflight from the web origin, and a fetch of the web app. The card is redrawn when the result changes, and at least weekly.</sub>

| Part | Host | Address |
|---|---|---|
| Web app (Next.js) | **Vercel** | [carenexus-health.vercel.app](https://carenexus-health.vercel.app) |
| API (FastAPI in Docker) | **Render** | [carenexus-api.onrender.com/docs](https://carenexus-api.onrender.com/docs) |
| Database | **Neon** (serverless PostgreSQL) | private |

Pushes to `main` redeploy the web app, and the API when backend code changed. The API is infrastructure as code in [`render.yaml`](render.yaml) (a Render **Blueprint**): Docker build, `/health` check, a generated `SECRET_KEY`, and a refusal to start in production without one.

<details>
<summary><b>Configuration the hosts need</b></summary>

Secrets never live in git.

| Variable | Where | Value |
|---|---|---|
| `DATABASE_URL` | Render | Neon connection string, **direct** (not pooled); `sslmode` is translated for asyncpg |
| `ALLOWED_ORIGINS` | Render | `["https://carenexus-health.vercel.app"]` |
| `NEXT_PUBLIC_API_URL` | Vercel | `https://carenexus-api.onrender.com` (inlined at build time) |

</details>

## Quality

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/stats-dark.svg">
  <img src="docs/assets/stats-light.svg" alt="Measured by CI: tests passing, backend coverage, retrieval accuracy, conditions in the library, known vulnerabilities" width="100%">
</picture>

Every figure above is read from a CI report; none is typed by hand.

| Suite | Runs on | What it covers |
|:--|:--|:--|
| Backend (pytest) | SQLite **and** PostgreSQL 16 | units, API contracts, security, edge cases, database integrity, retrieval quality, emergency phrasing |
| Frontend unit (Vitest) | Node | API client refresh and errors, time parsing, body-map logic |
| End-to-end (Playwright) | Chromium | the production build, the real API and a database |

**Retrieval accuracy** is measured on everyday-language queries, including a held-out set written before any tuning. Fixing the index (it was matching words in treatment advice rather than symptoms) lifted the first-match rate from 62.8% to 86.0%, and from 73.3% to 93.3% on unseen queries. CI fails if it drops.

**Emergency detection** is tested against the way people actually write: *"pain in my chest"*, *"I can’t breathe"* typed with a phone's curly apostrophe, *"I blacked out"*. Thirty such phrasings must reach the right emergency, and nine everyday complaints must not.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/divider-dark.svg">
  <img src="docs/assets/divider-light.svg" alt="" width="100%">
</picture>

## How a message is assessed

```mermaid
flowchart LR
    M([Message]) --> S[Sanitise<br/><sub>strip HTML, refuse<br/>prompt injection</sub>]
    S --> R{Emergency<br/>rules}
    R -- match --> RED([🔴 Emergency])
    R -- no match --> P[Parse<br/><sub>body parts, duration,<br/>severity words</sub>]
    P --> F[Profile risk<br/><sub>age, sex,<br/>known conditions</sub>]
    F --> Q[Retrieve<br/><sub>top 3 of 49<br/>conditions</sub>]
    Q --> G{Gemini<br/>key?}
    G -- yes --> L[LLM answer<br/>grounded in matches]
    G -- no / error --> O[Offline rules<br/>answer]
    L --> A([Graded answer])
    O --> A
```

1. **Sanitise.** HTML is stripped; 12 prompt-injection patterns are refused.
2. **Emergency rules first.** The text is normalised (case, apostrophes, punctuation) and matched against phrase patterns for heart, breathing, stroke, crisis, collapse and bleeding. Negation is deliberately ignored: a false alarm is safer than a missed heart attack.
3. **Parse and personalise.** Duration, severity words and the health profile raise the level of concern.
4. **Retrieve.** TF-IDF with field weighting (a condition's name counts more than its description), light stemming and medical synonyms.
5. **Answer.** Gemini writes the reply from the retrieved conditions, or the offline engine builds it; any LLM failure falls back to offline.

### One request, end to end

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (Vercel)
    participant A as API (Render)
    participant E as Triage engine
    participant D as PostgreSQL (Neon)
    B->>A: POST /chat/message · Bearer access token
    A->>A: CORS, request ID, security headers
    A->>A: verify JWT · rate limit 10/min per user · sanitise
    A->>D: load or create session, store message
    A->>E: message + health profile
    E-->>A: level, answer, sources
    A->>D: store answer, bump session
    A-->>B: both messages, UTC timestamps
    Note over B,A: On 401: one shared token refresh, then replay
```

## Architecture

```mermaid
flowchart TB
    subgraph Vercel["Vercel · Next.js 16 · React 19"]
        UI[Pages: home, chat, dashboard, profile]
        BM[3D body map<br/>three.js, lazy-loaded]
        AC[API client<br/>silent token refresh]
    end
    subgraph Render["Render · FastAPI in Docker"]
        MW[Middleware<br/>CORS, request IDs, security headers]
        RT[Routes<br/>auth, chat, health-profile, analytics]
        SV[Services]
        TE[Triage engine<br/>emergency rules, parser]
        RAG[Retriever<br/>TF-IDF over 49 conditions]
        LLM[Gemini<br/>optional]
    end
    DB[(Neon PostgreSQL<br/>SQLite locally)]
    UI --> AC
    UI --> BM
    AC -- "JSON over HTTPS, JWT" --> MW --> RT --> SV
    SV --> TE --> RAG
    TE -.-> LLM
    SV --> DB
```

Routes validate and handle HTTP, services hold the logic, models map tables; routes never touch SQL. More in [docs/architecture.md](docs/architecture.md).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/divider-dark.svg">
  <img src="docs/assets/divider-light.svg" alt="" width="100%">
</picture>

## Engineering

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/activity-dark.svg">
  <img src="docs/assets/activity-light.svg" alt="Commit activity: commits to main per day, and the share of each Conventional Commit type." width="100%">
</picture>

```mermaid
flowchart LR
    push([push / PR]) --> BL[Backend lint<br/>pinned Ruff]
    BL --> BT[Tests on SQLite<br/>coverage ≥ 90%<br/>retrieval accuracy]
    BL --> PG[Tests on<br/>PostgreSQL 16]
    push --> FL[Frontend lint,<br/>types, unit tests]
    push --> AU[Dependency audits<br/>pip-audit, npm audit]
    BT --> E2E[End-to-end<br/>browser + API + DB]
    PG --> E2E
    FL --> E2E
    E2E --> DEP([Vercel + Render<br/>deploy from main])
```

### Security

- Passwords are SHA-256 pre-hashed, then bcrypt (no 72-byte truncation); older hashes upgrade at the next login
- JWT access and refresh tokens with a `type` claim; refresh re-checks that the account is active
- Rate limits: 5/min per IP for sign-in, 10/min **per user** for chat; proxy headers trusted only when configured
- Input sanitising, prompt-injection refusal, and HTML escaped again before rendering
- Foreign keys and cascades enforced by the database, SQLite included
- A malformed `DATABASE_URL` fails without echoing its value, so a typo cannot leak the password into logs
- The API refuses to start in production with the default secret; CORS admits only the web origin
- Dependabot proposes updates after a 14-day cooldown; CI audits shipped dependencies on every push

**Known limitation:** tokens are kept in `localStorage`, which an XSS flaw could read; `httpOnly` cookies are the next step.

<details>
<summary><b>API endpoints</b></summary>

Interactive docs: [carenexus-api.onrender.com/docs](https://carenexus-api.onrender.com/docs) (or locally at `:8000/docs`). All timestamps are UTC with an explicit offset.

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| POST | `/api/v1/auth/register` | Create an account | |
| POST | `/api/v1/auth/login` | Sign in, receive tokens | |
| POST | `/api/v1/auth/refresh` | New token pair from `{"refresh_token": ...}` | |
| GET | `/api/v1/auth/me` | Current user | Bearer |
| POST | `/api/v1/chat/message` | Send a message, receive a graded answer | Bearer |
| GET | `/api/v1/chat/sessions` | Conversations, most recent activity first | Bearer |
| GET | `/api/v1/chat/sessions/{id}/messages` | Messages of one conversation | Bearer |
| GET POST PUT DELETE | `/api/v1/health-profile/` | Health profile (PUT: `null` clears a field) | Bearer |
| GET | `/api/v1/analytics/overview` | Totals across the server | Bearer |
| GET | `/api/v1/analytics/my-stats` | The caller's own totals | Bearer |
| GET | `/api/v1/analytics/triage-distribution` | Answers per level | Bearer |
| GET | `/api/v1/analytics/daily-usage?days=1..90` | Messages per day | Bearer |
| GET | `/api/v1/analytics/rag-index` | Library size | Bearer |

</details>

<details>
<summary><b>Project structure</b></summary>

```
CareNexus/
├── backend/
│   ├── app/
│   │   ├── api/routes/        auth, chat, health_profile, analytics
│   │   ├── core/              config, database, middleware, rate limiter, sanitiser
│   │   │   └── triage/        engine, emergency rules, symptom parser, prompts
│   │   ├── rag/               knowledge base (49 conditions), vectoriser, synonyms, retriever
│   │   ├── models/ schemas/   SQLAlchemy models, Pydantic schemas
│   │   └── services/          auth, chat, profile, analytics, LLM
│   ├── scripts/               eval_retrieval.py
│   ├── tests/                 pytest suites + labelled retrieval data
│   └── Dockerfile
├── frontend/
│   ├── src/app/               pages
│   ├── src/components/        navbar, chat sidebar, messages, 3D body map
│   ├── src/lib/               API client, design tokens, triage levels (+ unit tests)
│   ├── e2e/                   Playwright tests
│   └── scripts/readme/        generators for this README's artwork
├── docs/                      architecture.md, generated assets
├── .github/workflows/         ci.yml, readme-assets.yml
├── render.yaml                API deployment (Render Blueprint)
└── run.py, start.cmd, start.sh, start.ps1, docker-compose.yml
```

</details>

<details>
<summary><b>How this README keeps itself current</b></summary>

No image here is drawn by hand. Each is generated by a script from the real project, in a dark and a light version that follow your GitHub theme, and carries its own fonts subset to the glyphs it uses (GitHub's image proxy blocks external fonts; subsetting with fontTools keeps each file small).

| Script | Produces | From |
|:--|:--|:--|
| [`banner.mjs`](frontend/scripts/readme/banner.mjs) | animated header | three real engine outputs, the app's fonts and colours |
| [`stats.mjs`](frontend/scripts/readme/stats.mjs) | quality card | pytest, coverage, Vitest, Playwright, retrieval and audit reports |
| [`cards.mjs`](frontend/scripts/readme/cards.mjs) | principles, stack, dividers | `stats.json`, `package.json`, `requirements.txt` |
| [`status.mjs`](frontend/scripts/readme/status.mjs) | production status | live probes of the deployed API and web app |
| [`activity.mjs`](frontend/scripts/readme/activity.mjs) | commit activity | `git log`, bots excluded |
| [`capture.mjs`](frontend/scripts/readme/capture.mjs) | screenshots, demo GIF | Playwright driving the running app, ffmpeg |

[`readme-assets.yml`](.github/workflows/readme-assets.yml) runs them weekly and after relevant pushes, and commits only when something actually changed.

</details>

## Tech stack

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/stack-dark.svg">
  <img src="docs/assets/stack-light.svg" alt="Interface: Next.js, React, Tailwind, three.js, TypeScript. Service: FastAPI, SQLAlchemy, Pydantic, PyJWT, bcrypt. Data and triage: PostgreSQL, SQLite, TF-IDF retrieval, optional Gemini. Quality and delivery: pytest, Vitest, Playwright, GitHub Actions, Vercel, Render, Neon." width="100%">
</picture>

## Disclaimer

CareNexus is a final-year capstone project. It gives general health information and is **not** a substitute for professional medical advice, diagnosis or treatment. In an emergency, call your local emergency number.

<div align="center"><sub>MIT licensed · built by <a href="https://github.com/sarthaksaxenaa">Sarthak Saxena</a></sub></div>
