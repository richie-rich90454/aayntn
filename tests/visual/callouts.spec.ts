/**
 * Callouts, navigation rails, headings and code actions must carry their
 * emphasis in a complete border, a background, or a horizontal rule. A
 * left-only stripe is the one treatment they may not use.
 */
import { test, expect } from "@playwright/test";

const SELECTOR = [
    ".aayntn-math",
    ".aayntn-note",
    ".aayntn-hint__body",
    ".aayntn-variant-note",
    ".aayntn-contest__notice",
    ".aayntn-nav__link",
    ".aayntn-nav__item",
    ".aayntn-sidebar__link",
    ".aayntn-outline__link",
    ".aayntn-code__action",
    ".vp-doc h2",
    ".vp-doc h3",
    "blockquote",
].join(", ");

test.describe("the vertical rules", () => {
    test("never use a left-only border", async ({ page }) => {
        const paths = ["/", "/algorithms/graphs/dijkstra/", "/practice/", "/contest/"];

        for (const path of paths) {
            await page.goto(path, { waitUntil: "networkidle" });

            if (path === "/practice/") {
                const reveal = page.getByRole("button", { name: "Reveal a hint" }).first();
                if (await reveal.count()) await reveal.click();
            }

            const uneven = await page.evaluate((selector) => {
                return [...document.querySelectorAll<HTMLElement>(selector)]
                    .map((element) => {
                        const style = getComputedStyle(element);
                        return {
                            element: element.className || element.tagName,
                            top: parseFloat(style.borderTopWidth),
                            right: parseFloat(style.borderRightWidth),
                            bottom: parseFloat(style.borderBottomWidth),
                            left: parseFloat(style.borderLeftWidth),
                        };
                    })
                    .filter(
                        (box) =>
                            box.left !== box.top ||
                            box.left !== box.right ||
                            box.left !== box.bottom,
                    );
            }, SELECTOR);

            expect(uneven, path).toEqual([]);
        }
    });
});
