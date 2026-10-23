/**
 * The print sheet.
 *
 * A browser print of the site must be a legible paper document in both
 * appearances: dark ink on white paper, no navigation, no code block split
 * across two sheets, and a real A4 page rule.
 */
import { test, expect, type Page } from "@playwright/test";

const ARTICLE = "/algorithms/graphs/dijkstra/";

const APPEARANCES = [
    { name: "light", dark: false },
    { name: "dark", dark: true },
];

async function openArticle(page: Page, appearance?: string): Promise<void> {
    if (appearance) {
        await page.addInitScript((mode) => {
            window.localStorage.setItem("vitepress-theme-appearance", mode);
        }, appearance);
    }
    await page.goto(ARTICLE, { waitUntil: "load" });
    await page.waitForSelector(".aayntn-prose p");
    await page.emulateMedia({ media: "print" });
}

function channel(value: string): number {
    const match = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value);
    expect(match, `unreadable color value: ${value}`).not.toBeNull();
    return Number(match![1]);
}

test.describe("the print appearance", () => {
    for (const appearance of APPEARANCES) {
        test(`prints dark text on paper in the ${appearance.name} appearance`, async ({ page }) => {
            await openArticle(page, appearance.name);

            const color = await page
                .locator(".aayntn-prose p")
                .first()
                .evaluate((element) => window.getComputedStyle(element).color);
            expect(
                channel(color),
                `${appearance.name} body text is not dark: ${color}`,
            ).toBeLessThan(80);

            const background = await page.evaluate(
                () => window.getComputedStyle(document.body).backgroundColor,
            );
            expect(background).toContain("255");
        });
    }

    test("hides the reading chrome", async ({ page }) => {
        await openArticle(page);

        const hidden = await page.evaluate(() => {
            const selectors = [
                ".aayntn-header",
                ".aayntn-sidebar",
                ".aayntn-outline",
                ".aayntn-footer",
                ".aayntn-scrim",
                ".aayntn-code__actions",
            ];
            return selectors.map((selector) => {
                const element = document.querySelector(selector);
                return element ? window.getComputedStyle(element).display === "none" : true;
            });
        });

        expect(hidden.every(Boolean)).toBe(true);
    });

    test("keeps every code block on one page", async ({ page }) => {
        await openArticle(page);
        await page.waitForFunction(
            () => document.querySelectorAll('.aayntn-code, div[class*="language-"]').length > 0,
        );

        const breaks = await page.evaluate(() => {
            const blocks = Array.from(
                document.querySelectorAll('.aayntn-code, div[class*="language-"]'),
            );
            return blocks.map((block) => window.getComputedStyle(block).breakInside);
        });

        expect(breaks.length).toBeGreaterThan(0);
        expect(breaks.every((value) => value === "avoid")).toBe(true);
    });

    test("declares an A4 page rule", async ({ page }) => {
        await openArticle(page);

        const pageRules = await page.evaluate(() => {
            const found: string[] = [];
            const walk = (rules: CSSRuleList): void => {
                for (const rule of Array.from(rules)) {
                    if (rule.type === 6 || rule.constructor.name === "CSSPageRule") {
                        found.push(rule.cssText);
                    }
                    const nested = (rule as CSSMediaRule).cssRules;
                    if (nested) walk(nested);
                }
            };
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    walk(sheet.cssRules);
                } catch {
                    // A cross-origin sheet is not the one this test measures.
                }
            }
            return found;
        });

        const text = pageRules.join("\n");
        expect(text).toMatch(/a4/i);
        expect(text).toContain("18mm");
        expect(text).toContain("20mm");
    });
});
