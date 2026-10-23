/**
 * The shell: the masthead navigation and its menus.
 *
 * The primary navigation has to be present at every width, without pushing
 * the page sideways or cutting a label, and the dropdowns have to work for a
 * pointer as well as for a keyboard. The destinations are checked against the
 * preview server, so a menu that names a page nobody built fails here.
 *
 * Run with:  pnpm exec playwright test
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
];

const GROUPS = ["Learn", "Reference", "Tools", "About"];

const DESTINATION_COUNT = 16;

const DOCS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../docs");
const BASE_PATH = (process.env["AAYNTN_BASE"] ?? "/").replace(/\/+$/, "");

/** The Markdown sources that can serve an address, relative to the docs root. */
function sourceCandidates(href: string): string[] {
    let pathname = decodeURIComponent(href.split("#")[0]?.split("?")[0] ?? "");
    if (BASE_PATH && pathname.startsWith(`${BASE_PATH}/`)) {
        pathname = pathname.slice(BASE_PATH.length);
    }
    const relative = pathname.replace(/^\/+|\/+$/g, "");
    if (relative === "") return [join(DOCS_ROOT, "index.md")];
    return [join(DOCS_ROOT, `${relative}.md`), join(DOCS_ROOT, relative, "index.md")];
}

test.describe("the primary navigation", () => {
    for (const viewport of VIEWPORTS) {
        test(`is present and unclipped at ${viewport.width} pixels`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto("/", { waitUntil: "networkidle" });

            const nav = page.getByRole("navigation", { name: "Primary" });
            await expect(nav).toBeVisible();

            const triggers = nav.getByRole("button");
            await expect(triggers).toHaveCount(GROUPS.length);
            for (const group of GROUPS) {
                await expect(nav.getByRole("button", { name: group })).toBeVisible();
            }

            const layout = await page.evaluate(() => {
                const strip = document.querySelector(".aayntn-nav__strip");
                const clipped: string[] = [];
                for (const label of Array.from(document.querySelectorAll(".aayntn-nav__label"))) {
                    const box = label.getBoundingClientRect();
                    if (box.width === 0 || box.height === 0) continue;
                    if (label.scrollWidth > label.clientWidth + 1) {
                        clipped.push(label.textContent?.trim() ?? "");
                    }
                }
                return {
                    overflow: document.documentElement.scrollWidth - window.innerWidth,
                    clipped,
                    stripOverflow: strip ? getComputedStyle(strip).overflowX : "",
                };
            });

            expect(
                layout.overflow,
                `the page scrolls sideways by ${layout.overflow} pixels at ${viewport.width}`,
            ).toBeLessThanOrEqual(2);
            expect(layout.clipped, "a group label is cut off").toEqual([]);
            expect(["auto", "scroll"]).toContain(layout.stripOverflow);

            for (const group of GROUPS) {
                const trigger = nav.getByRole("button", { name: group });
                await trigger.click();
                await expect(trigger).toHaveAttribute("aria-expanded", "true");

                const controls = await trigger.getAttribute("aria-controls");
                expect(controls, `${group} has no controlled menu`).toBeTruthy();
                const menu = page.locator(`#${controls}`);
                await expect(menu).toBeVisible();
                expect(await menu.getByRole("menuitem").count()).toBeGreaterThan(1);

                const clippedItems = await menu.evaluate((element) =>
                    Array.from(element.querySelectorAll(".aayntn-nav__item-label"))
                        .filter((label) => label.scrollWidth > label.clientWidth + 1)
                        .map((label) => label.textContent?.trim() ?? ""),
                );
                expect(clippedItems, `a ${group} label is cut off`).toEqual([]);

                const overflow = await page.evaluate(
                    () => document.documentElement.scrollWidth - window.innerWidth,
                );
                expect(
                    overflow,
                    `the ${group} menu pushes the page sideways at ${viewport.width}`,
                ).toBeLessThanOrEqual(2);

                await page.keyboard.press("Escape");
                await expect(trigger).toHaveAttribute("aria-expanded", "false");
            }
        });
    }
});

test.describe("the navigation menus", () => {
    test("open by keyboard, move with the arrow keys, and close on Escape", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/algorithms/", { waitUntil: "networkidle" });

        const nav = page.getByRole("navigation", { name: "Primary" });
        const reference = nav.getByRole("button", { name: "Reference" });
        await expect(reference).toHaveClass(/is-active/);

        await reference.focus();
        await page.keyboard.press("Enter");
        await expect(reference).toHaveAttribute("aria-expanded", "true");

        const controls = await reference.getAttribute("aria-controls");
        const menu = page.locator(`#${controls}`);
        await expect(menu).toBeVisible();

        const items = menu.getByRole("menuitem");
        await expect(items.first()).toBeFocused();

        await page.keyboard.press("ArrowDown");
        await expect(items.nth(1)).toBeFocused();
        await page.keyboard.press("ArrowUp");
        await expect(items.first()).toBeFocused();

        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(reference).toHaveAttribute("aria-expanded", "false");
        await expect(reference).toBeFocused();

        // The trigger opens the menu again on the arrow that points into it.
        await page.keyboard.press("ArrowDown");
        await expect(reference).toHaveAttribute("aria-expanded", "true");
        await expect(items.first()).toBeFocused();
        await page.keyboard.press("Escape");
    });

    test("close when the pointer lands outside them", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/", { waitUntil: "networkidle" });

        const nav = page.getByRole("navigation", { name: "Primary" });
        const trigger = nav.getByRole("button", { name: "Learn" });
        await trigger.click();
        await expect(trigger).toHaveAttribute("aria-expanded", "true");

        await page.locator(".aayntn-brand").click();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
});

test.describe("the navigation destinations", () => {
    test("every link in every group resolves to a page", async ({ page, request }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        const hrefs = await page
            .locator(".aayntn-nav__item")
            .evaluateAll((links) =>
                Array.from(
                    new Set(
                        links
                            .map((link) => link.getAttribute("href") ?? "")
                            .filter((href) => href !== ""),
                    ),
                ),
            );

        expect(hrefs).toHaveLength(DESTINATION_COUNT);

        for (const href of hrefs) {
            expect(
                sourceCandidates(href).some((candidate) => existsSync(candidate)),
                `${href} has no Markdown source`,
            ).toBe(true);

            const response = await request.get(href);
            expect(response.status(), `${href} does not resolve to a page`).toBe(200);
        }
    });
});
