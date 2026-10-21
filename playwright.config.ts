import { defineConfig, devices } from "@playwright/test";

/**
 * The visual regression configuration.
 *
 * The screenshots are taken against a preview server, so the suite measures
 * the published site rather than the development server.
 */
export default defineConfig({
    testDir: "./tests/visual",
    testMatch: /.*\.spec\.ts/,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: process.env.AAYNTN_BASE_URL ?? "http://localhost:4173",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: process.env.AAYNTN_BASE_URL
        ? undefined
        : {
              command: "pnpm exec vitepress preview docs --port 4173",
              url: "http://localhost:4173",
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
