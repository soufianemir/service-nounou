import { defineConfig } from "@playwright/test";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Playwright tests.");
}
const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true
  },
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: false,
    env: {
      PORT: port,
      DATABASE_URL: databaseUrl
    }
  }
});
