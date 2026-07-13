import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// e2e runs against a dev server bound to the dedicated test database, so it never touches
// development or production data. In CI, DATABASE_URL is provided by the workflow.
const testDbUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/bytesized_test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDbUrl,
      DB_DRIVER: 'node-postgres',
      RESUME_TOKEN_SECRET: 'e2e-resume-secret',
      RATE_LIMIT_IP_PEPPER: 'e2e-pepper',
      AUTH_SECRET: 'e2e-auth-secret',
      EMAIL_DELIVERY_ENABLED: 'false',
      EMAIL_VERIFICATION_ENABLED: 'false',
    },
  },
});
