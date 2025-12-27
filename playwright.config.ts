import path from "path";
import { defineConfig } from "@playwright/test";

const dbPath = path.join(process.cwd(), "data", "app.db").replace(/\\/g, "/");
const databaseUrl = `file:${dbPath}`;
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
