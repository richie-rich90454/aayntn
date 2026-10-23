import { defineConfig, devices } from "@playwright/test";

/**
 * The visual regression configuration.
 *
 * The screenshots are taken against a preview server, so the suite measures
 * the published site rather than the development server.
 *
 * The port is not the one that another project is likely to have taken. If
 * it is taken anyway, the run says so instead of measuring somebody else's
 * site: set `AAYNTN_BASE_URL` to the address of a server that serves this
 * build, and no server is started here at all.
 */

const PORT = Number(process.env.AAYNTN_PORT ?? 4318);
const BASE_URL = process.env.AAYNTN_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: "./tests/visual",
    testMatch: /.*\.spec\.ts/,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: BASE_URL,
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
              command: `pnpm exec vitepress preview docs --port ${PORT} --host 127.0.0.1`,
              url: BASE_URL,
              reuseExistingServer: false,
              timeout: 120_000,
          },
});
