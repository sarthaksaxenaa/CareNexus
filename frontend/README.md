# CareNexus frontend

Next.js 16 app. See the [main README](../README.md) for the project overview.

```bash
npm ci              # install exactly what package-lock.json lists
npm run dev         # http://localhost:3000 (expects the API on :8000)
npm test            # unit tests (Vitest)
npm run build && npm run e2e   # end-to-end tests (Playwright)
```

The API address comes from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`); see `.env.example`.
