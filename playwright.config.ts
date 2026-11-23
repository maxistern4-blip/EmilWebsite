import { defineConfig, devices } from "@playwright/test";
export default defineConfig({ testDir: "./tests/e2e", use: { baseURL: "http://127.0.0.1:3217", ...devices["Desktop Chrome"], channel: "msedge" }, webServer: { command: "npm run dev -- --port 3217", url: "http://127.0.0.1:3217", reuseExistingServer: !process.env.CI } });
