import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a real deployment, not a local build. In CI the Vercel Git
 * integration publishes a preview per PR and the workflow passes its URL in
 * as BASE_URL; locally it falls back to `next dev`.
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // The mocked turn takes ~10s to stream, so give assertions room.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Every mobile bug in this UI so far has been WebKit-specific, so the
    // mobile project deliberately runs Safari rather than Chrome.
    { name: "mobile-safari", use: { ...devices["iPhone 14 Pro"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
