import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Assumes the storefront (and, for the full golden-path test,
 * the API + seeded Postgres) are already running — see
 * docs/deployment.md / AGENTS.md for how to bring the stack up locally, and
 * .github/workflows/ci.yml for how CI wires this up against the Postgres
 * service container. We do NOT use Playwright's `webServer` auto-start here
 * because the storefront alone isn't useful without the API/DB behind it.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
