# ─── Stage 1: Builder ──────────────────────────
# Python version matches CI (.github/workflows/ci.yml).
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Runtime ──────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/carenexus.db

WORKDIR /app

COPY --from=builder /install /usr/local
COPY app ./app

# Non-root user; /data holds the SQLite file and is mounted as a volume.
RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /data && chown appuser /data
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
