/**
 * The visual regression suite.
 *
 * These screenshots exist to protect the pages that are most likely to break.
 * A change to the decorative pages must never quietly damage a code-heavy
 * article, a long proof or a table, so the reference images are taken of
 * exactly those.
 *
 * Run with:  pnpm exec playwright test
 */
import { test, expect } from "@playwright/test";

/** The pages that carry the design, with the width each is checked at. */
const REFERENCES = [
    { name: "home", path: "/", width: 1440, height: 1200 },
    {
        name: "academy",
        path: "/start/from-ap-csa/part-2-algorithm-analysis/",
        width: 1440,
        height: 1200,
    },
    { name: "code-article", path: "/algorithms/graphs/dijkstra/", width: 1440, height: 1200 },
    { name: "long-proof", path: "/algorithms/searching/binary-search/", width: 1440, height: 1200 },
    {
        name: "code-panel",
        path: "/algorithms/range-queries/segment-tree/",
        width: 1440,
        height: 1200,
    },
    { name: "language-center", path: "/languages/cpp17/", width: 1440, height: 1200 },
    { name: "curriculum", path: "/curriculum/gold/", width: 1440, height: 1200 },
    { name: "mobile-code", path: "/algorithms/graphs/dfs/", width: 390, height: 900 },
    { name: "search", path: "/algorithms/", width: 1440, height: 900 },
];

test.describe("the reference pages", () => {
    for (const reference of REFERENCES) {
        test(`${reference.name} renders`, async ({ page }) => {
            await page.setViewportSize({ width: reference.width, height: reference.height });
            await page.goto(reference.path, { waitUntil: "networkidle" });

            // The page must have a title and a heading that a screen reader
            // would announce.
            await expect(page).toHaveTitle(/A.A.Y.N.T.N./);
            await expect(page.locator("h1").first()).toBeVisible();

            await expect(page).toHaveScreenshot(`${reference.name}.png`, {
                fullPage: false,
                animations: "disabled",
                maxDiffPixelRatio: 0.02,
            });
        });
    }
});

test.describe("the laboratory", () => {
    test("steps through a demonstration", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1200 });
        await page.goto("/algorithms/graphs/dijkstra/", { waitUntil: "networkidle" });

        const player = page.locator(".aayntn-lab").first();
        await expect(player).toBeVisible();

        // The narration must change when the reader steps forward.
        const narration = player.locator(".aayntn-lab__narration");
        const before = await narration.textContent();
        await player.getByLabel("Step forward").click();
        await expect(narration).not.toHaveText(before ?? "");
    });
});

test.describe("the search", () => {
    test("finds a technique by its abbreviation", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/algorithms/", { waitUntil: "networkidle" });

        await page.getByLabel("Search A.A.Y.N.T.N.").click();
        const field = page.getByLabel("Search query");
        await field.fill("disjoint set union");
        await expect(page.locator(".aayntn-search__result").first()).toBeVisible();
    });
});
