/**
 * The visual regression suite.
 *
 * These checks exist to protect the pages that are most likely to break. A
 * change to the decorative pages must never quietly damage a code-heavy
 * article, a long proof or a table, so every reference page is opened at
 * every width that the design supports and measured.
 *
 * The measurement is of the layout rather than of the pixels. A reference
 * image of a page of text differs between two machines for reasons that have
 * nothing to do with the design, and it fails on a machine that has a
 * different font rasterizer. What the reader actually notices is that a
 * column is cut off, that a line of code runs past the edge of the page, or
 * that a heading has been pushed off the screen. Those are the failures this
 * suite looks for.
 *
 * Run with:  pnpm exec playwright test
 */
import { test, expect } from "@playwright/test";

/** The pages that carry the design. */
const REFERENCES = [
    { name: "home", path: "/" },
    { name: "academy", path: "/start/from-ap-csa/part-2-algorithm-analysis/" },
    { name: "code-article", path: "/algorithms/graphs/dijkstra/" },
    { name: "long-proof", path: "/algorithms/searching/binary-search/" },
    { name: "code-panel", path: "/algorithms/range-queries/segment-tree/" },
    { name: "language-center", path: "/languages/cpp17/" },
    { name: "curriculum", path: "/curriculum/gold/" },
    { name: "index-tables", path: "/algorithms/" },
    { name: "contest", path: "/contest/" },
    { name: "debugging", path: "/debugging/" },
    { name: "laboratory", path: "/laboratory/" },
];

/**
 * The widths that the design supports, from the narrowest phone to a screen
 * that is wider than any desk.
 */
const WIDTHS = [
    { name: "phone", width: 360, height: 780 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "laptop", width: 1440, height: 1000 },
    { name: "wide", width: 1920, height: 1080 },
    { name: "ultrawide", width: 2560, height: 1200 },
];

/**
 * The appearances that the design supports. The dark one is not the light
 * one with the lights turned off, so it is measured on its own.
 */
const APPEARANCES = [
    { name: "light", dark: false },
    { name: "dark", dark: true },
];

/** The tolerance of the measurement, in pixels, for a rounding error. */
const TOLERANCE = 2;

test.describe("the reference pages", () => {
    for (const reference of REFERENCES) {
        for (const size of WIDTHS) {
            for (const appearance of APPEARANCES) {
                test(`${reference.name} fits at ${size.name} in the ${appearance.name} appearance`, async ({
                    page,
                }) => {
                    await page.setViewportSize({ width: size.width, height: size.height });
                    await page.addInitScript((mode) => {
                        window.localStorage.setItem("vitepress-theme-appearance", mode);
                    }, appearance.name);
                    await page.goto(reference.path, { waitUntil: "networkidle" });

                    // The appearance must be the one that was asked for.
                    const isDark = await page.evaluate(() =>
                        document.documentElement.classList.contains("dark"),
                    );
                    expect(isDark, `${reference.path} is in the wrong appearance`).toBe(
                        appearance.dark,
                    );

                    // The page must have a title and a heading that a screen
                    // reader would announce.
                    await expect(page).toHaveTitle(/A.A.Y.N.T.N./);
                    await expect(page.locator("h1").first()).toBeVisible();

                    // The page must not scroll sideways. A reader who has to
                    // scroll sideways has lost the measure of the text.
                    const overflow = await page.evaluate(
                        () => document.documentElement.scrollWidth - window.innerWidth,
                    );
                    expect(
                        overflow,
                        `${reference.path} overflows sideways by ${overflow} pixels at ${size.width}`,
                    ).toBeLessThanOrEqual(TOLERANCE);

                    // No element may stick out of the page. A panel that is
                    // wider than the page is a panel that is cut off. An element
                    // inside a box that scrolls or clips is allowed to be wider
                    // than the page, because the reader scrolls to it.
                    const wide = await page.evaluate(() => {
                        const limit = document.documentElement.clientWidth;
                        const contained = (element: Element): boolean => {
                            for (
                                let node = element.parentElement;
                                node;
                                node = node.parentElement
                            ) {
                                if (window.getComputedStyle(node).overflowX !== "visible")
                                    return true;
                            }
                            return false;
                        };
                        const offenders: string[] = [];
                        for (const element of Array.from(document.querySelectorAll("body *"))) {
                            const box = element.getBoundingClientRect();
                            if (box.width === 0 || box.height === 0) continue;
                            if (box.right <= limit + 2) continue;
                            if (contained(element)) continue;
                            offenders.push(
                                `${element.tagName.toLowerCase()}.${element.className || ""}`.slice(
                                    0,
                                    80,
                                ),
                            );
                        }
                        return offenders.slice(0, 5);
                    });
                    expect(
                        wide,
                        `${reference.path} has an element past the edge: ${wide.join(", ")}`,
                    ).toEqual([]);

                    // The text must keep its measure. A column of the outline
                    // that is allowed to stand beside the text on a phone
                    // would squeeze the text into a ribbon.
                    const measure = await page.evaluate(() => {
                        const main = document.querySelector(".aayntn-main");
                        if (!main) return -1;
                        return Math.round(main.getBoundingClientRect().width);
                    });
                    const available = size.width - 48;
                    if (measure >= 0) {
                        expect(
                            measure,
                            `${reference.path} squeezes the text to ${measure} pixels at ${size.width}`,
                        ).toBeGreaterThanOrEqual(Math.min(available, 780) * 0.9);
                    }

                    // The search control must be on the screen. A navigation that
                    // is too wide pushes it off the edge, and the reader loses
                    // the only way into the encyclopedia.
                    const search = page.locator(".aayntn-search__button").first();
                    if (await search.isVisible()) {
                        const box = await search.boundingBox();
                        expect(
                            box,
                            `${reference.path} has no search control at ${size.width}`,
                        ).not.toBeNull();
                        expect(
                            box!.x + box!.width,
                            `${reference.path} has the search control past the edge at ${size.width}`,
                        ).toBeLessThanOrEqual(size.width + TOLERANCE);
                    }
                });
            }
        }
    }
});

test.describe("the laboratory", () => {
    test("steps through a demonstration", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1200 });
        await page.goto("/algorithms/graphs/dijkstra/", { waitUntil: "networkidle" });

        const player = page.locator(".aayntn-lab").first();
        await expect(player).toBeVisible();

        // The narration must change when the reader steps forward.
        const narration = player.locator(".aayntn-lab__narration").first();
        const before = await narration.textContent();
        await player.getByLabel("Step forward").first().click();
        await expect(narration).not.toHaveText(before ?? "");
    });
});

test.describe("the search", () => {
    test("finds a technique by its name", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/algorithms/", { waitUntil: "networkidle" });

        await page.getByLabel("Search A.A.Y.N.T.N.").first().click();
        const field = page.getByLabel("Search query");
        await field.fill("disjoint set union");
        await expect(page.locator(".aayntn-search__result").first()).toBeVisible();
        await expect(page.locator(".aayntn-search__result").first()).toContainText(
            "Disjoint set union",
        );
    });
});
