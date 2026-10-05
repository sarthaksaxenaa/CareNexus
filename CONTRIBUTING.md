# Contributing to CareNexus

Thank you for your interest in contributing to CareNexus! 🏥

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional but recommended)
- Git

### Quick Start

```bash
# Clone the repo
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus

# Option 1: Docker (recommended)
docker compose up -d

# Option 2: Manual
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Git Workflow

1. Create a feature branch from `develop`: `git checkout -b feature/your-feature develop`
2. Make your changes with meaningful commits following [Conventional Commits](https://www.conventionalcommits.org/)
3. Push and create a Pull Request to `develop`
4. Wait for CI to pass and request review

## Commit Messages

We use Conventional Commits:

```
feat(scope): add new feature
fix(scope): fix a bug
docs(scope): update documentation
test(scope): add or fix tests
chore(scope): maintenance tasks
```

## Code Style

- **Python**: Formatted with Ruff, type-checked with mypy
- **TypeScript**: Formatted with Prettier, linted with ESLint
