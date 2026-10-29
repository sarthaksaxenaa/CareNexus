import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests: a real browser against the real API and database.
 *
 * `npm run e2e` starts both servers itself. Locally, already-running servers
 * on the same ports are reused. The frontend must be built first
 * (`npm run build`) because the tests run against the production server.
 *
 * E2E_PYTHON selects the interpreter that has the backend requirements
 * installed (default: "python").
 */
const PYTHON = process.env.E2E_PYTHON ?? "python";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // one shared database and server
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `${PYTHON} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: "../backend",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !isCI,
      timeout: 60_000,
      env: {
        // Fresh throwaway database; auth limit raised because the suite
        // registers and signs in many users from one IP.
        DATABASE_URL: "sqlite:///./e2e-test.db",
        RATE_LIMIT_AUTH: "1000",
        ALLOWED_ORIGINS: '["http://localhost:3000"]',
        DEBUG: "false",
      },
    },
    {
      command: "npm run start -- -p 3000",
      url: "http://localhost:3000",
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});
