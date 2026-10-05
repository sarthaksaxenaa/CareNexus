# CareNexus — System Architecture

## Overview
CareNexus follows a modular, layered architecture designed for scalability, maintainability, and deployment flexibility.

## Components

### Frontend (Next.js)
- Server-side rendered React application
- Responsive chat interface with real-time messaging
- Health dashboard and symptom timeline

### Backend API (FastAPI)
- RESTful API with JWT authentication
- Request validation with Pydantic
- Async request handling with uvicorn

### AI Engine (LangChain + LLM)
- RAG pipeline for grounded medical responses
- Symptom extraction via medical NER
- Severity triage classification
- Red-flag emergency detection

### Data Layer
- PostgreSQL: User data, sessions, messages
- Redis: Caching, rate limiting, sessions
- ChromaDB: Medical knowledge vector embeddings

## Data Flow
1. User sends symptom description via chat UI
2. Frontend sends POST to `/api/v1/chat/message`
3. Backend extracts medical entities (symptoms, duration, severity)
4. RAG pipeline retrieves relevant medical knowledge
5. LLM generates response with context + safety guardrails
6. Triage engine classifies severity level
7. Response returned with severity badge, citations, and disclaimer
