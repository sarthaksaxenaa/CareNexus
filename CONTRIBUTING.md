# Contributing to CareNexus

## Setup

```bash
git clone https://github.com/sarthaksaxenaa/CareNexus.git
cd CareNexus
python run.py
```

`run.py` creates `backend/venv`, installs dependencies and starts both servers. For tests and tooling, install the dev requirements too:

```bash
cd backend
venv/bin/pip install -r requirements-dev.txt     # Windows: venv\Scripts\pip
```

## Before you push

All of these run in CI and must pass:

```bash
# backend
cd backend
ruff check . && ruff format --check .
pytest                                  # coverage floor 90%
python -m scripts.eval_retrieval        # retrieval accuracy

# frontend
cd frontend
npm run lint && npx tsc --noEmit && npm test
npm run build && npm run e2e            # E2E_PYTHON=<python with backend deps>
```

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `refactor`, `test`, `docs`, `ci`, `build`, `chore`), one logical change per commit.
- **Tests first** for bug fixes: a failing test that reproduces the bug, then the fix.
- **Dependencies:** pin exact versions and prefer releases at least two weeks old. For npm, `npm install --before=<date>` applies that to the whole tree.
- **Retrieval changes:** run `python -m scripts.eval_retrieval` before and after; never tune against the held-out set.
- **Python** is formatted and linted with Ruff; **TypeScript** with ESLint.
