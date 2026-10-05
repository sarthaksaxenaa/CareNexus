<div align="center">

# 🏥 CareNexus

**AI-Powered Medical Chatbot for Primary Healthcare Triage**

[![CI Pipeline](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml/badge.svg)](https://github.com/sarthaksaxenaa/CareNexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000000.svg)](https://nextjs.org)

*Your first point of care — smart triage, trusted guidance, your health, your language.*

[Live Demo](#) · [Documentation](#) · [Report Bug](https://github.com/sarthaksaxenaa/CareNexus/issues) · [Request Feature](https://github.com/sarthaksaxenaa/CareNexus/issues)

</div>

---

## 🌟 Overview

CareNexus is an AI-powered medical chatbot that acts as an intelligent first responder for primary healthcare. It triages symptoms, provides evidence-based health guidance, and seamlessly connects patients to the right level of care.

> ⚕️ **Disclaimer**: CareNexus provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.

## ✨ Features

- 🔍 **Symptom Triage** — AI-powered severity assessment (🟢 Self-care / 🟡 See doctor / 🔴 Emergency)
- 📚 **RAG-Based Knowledge** — Responses grounded in WHO, NHS, and NIH medical guidelines
- 🌐 **Multilingual** — Support for English, Hindi, and regional languages
- 🚨 **Emergency Detection** — Automatic red-flag symptom identification
- 🔒 **Privacy-First** — Encrypted data, minimal collection, full consent management
- 📊 **Health Timeline** — Track symptoms and health patterns over time

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│   FastAPI API     │────▶│   LLM Engine    │
│   (Frontend)    │◀────│   (Backend)       │◀────│   (LangChain)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │      │                    │
                              ▼      ▼                    ▼
                        ┌──────┐  ┌──────┐         ┌──────────┐
                        │Postgres│  │Redis │         │ ChromaDB │
                        └──────┘  └──────┘         └──────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| AI/ML | LangChain, ChromaDB, OpenAI GPT-4o |
| Database | PostgreSQL 16, Redis 7 |
| DevOps | Docker, GitHub Actions, Vercel |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus
cp backend/.env.example backend/.env
docker compose up -d
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
CareNexus/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   ├── core/           # Config, AI engine, triage
│   │   ├── models/         # Database models
│   │   └── services/       # Business logic
│   ├── tests/              # Backend tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Next.js application
│   ├── src/app/            # App router pages
│   ├── Dockerfile
│   └── package.json
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Dev environment
└── README.md
```

## 🗺️ Roadmap

- [x] Project scaffolding & CI/CD setup
- [ ] User authentication (JWT)
- [ ] RAG pipeline with medical knowledge base
- [ ] LLM-powered chat with severity triage
- [ ] Multilingual support (EN + HI)
- [ ] Image-based symptom analysis
- [ ] Voice input/output
- [ ] Admin analytics dashboard

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ as a B.Tech Capstone Project</sub>
</div>
