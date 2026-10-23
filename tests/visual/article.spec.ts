/**
 * The article frame.
 *
 * These checks cover the reading frame around a lesson: the breadcrumb, the
 * header card, the status control, the section rail, the pager and the study
 * mode. They are measured on a technique page, because that page carries
 * every part of the frame at once.
 */
import { test, expect } from "@playwright/test";

const TECHNIQUE = "/algorithms/arrays/difference-arrays/";
const CODE_PAGE = "/algorithms/graphs/dijkstra/";

function normalize(path: string): string {
    return path.replace(/\/+$/, "");
}

test.describe("the article frame", () => {
    test("shows the subject index above the titled page", async ({ page }) => {
        await page.goto(TECHNIQUE, { waitUntil: "domcontentloaded" });

        const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
        await expect(crumbs).toBeVisible();
        await expect(crumbs.getByRole("link")).toHaveCount(1);
        await expect(crumbs.getByRole("link")).toHaveAttribute("href", /\/algorithms\/arrays$/);
        await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Difference arrays");
    });

    test("shows the cost of the technique in the header card", async ({ page }) => {
        await page.goto(TECHNIQUE, { waitUntil: "domcontentloaded" });

        const card = page.locator(".aayntn-article-meta");
        await expect(card).toBeVisible();
        await expect(card).toContainText("O(n + q)");
        await expect(card).toContainText("O(n)");
        await expect(card).toContainText("Intermediate");
        await expect(card).toContainText("Prefix sums");
    });

    test("keeps the lesson status after a reload", async ({ page }) => {
        await page.goto(TECHNIQUE, { waitUntil: "domcontentloaded" });

        const control = page.getByRole("group", { name: "Lesson status" });
        const mastered = control.getByRole("button", { name: "Mastered", exact: true });
        await expect(mastered).toHaveAttribute("aria-pressed", "false");

        await mastered.click();
        await expect(mastered).toHaveAttribute("aria-pressed", "true");

        await page.reload({ waitUntil: "domcontentloaded" });
        const restored = page
            .getByRole("group", { name: "Lesson status" })
            .getByRole("button", { name: "Mastered", exact: true });
        await expect(restored).toHaveAttribute("aria-pressed", "true");
    });

    test("moves to the next lesson and never repeats the current page", async ({ page }) => {
        await page.goto(TECHNIQUE, { waitUntil: "domcontentloaded" });

        const pager = page.getByRole("navigation", { name: "Previous and next" });
        const links = pager.getByRole("link");
        await expect(links.first()).toBeVisible();

        const current = normalize(new URL(page.url()).pathname);
        const hrefs = await links.evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("href") ?? ""),
        );
        for (const href of hrefs) {
            expect(normalize(new URL(href, page.url()).pathname)).not.toBe(current);
        }
        expect(new Set(hrefs).size).toBe(hrefs.length);

        const next = links.filter({ hasText: "Next" }).first();
        const nextHref = await next.getAttribute("href");
        expect(nextHref).toBeTruthy();

        await next.click();
        await expect(page.locator("h1.aayntn-article__title")).toBeVisible();
        expect(normalize(new URL(page.url()).pathname)).toBe(normalize(nextHref!));
        await expect(page.locator("h1.aayntn-article__title")).not.toContainText("404");
    });

    test("marks the heading the reader has reached", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(TECHNIQUE, { waitUntil: "domcontentloaded" });

        const rail = page.locator(".aayntn-rail");
        const links = rail.locator(".aayntn-outline__link");
        await expect(links.first()).toBeVisible();

        const target = links.nth(2);
        const href = await target.getAttribute("href");
        expect(href).toBeTruthy();

        await target.click();
        await expect(rail.locator(".aayntn-outline__link.is-active")).toHaveAttribute(
            "href",
            href!,
        );
    });

    test("study mode hides the code and survives a reload", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(CODE_PAGE, { waitUntil: "domcontentloaded" });

        const toggle = page.locator("[data-study-toggle]");
        await expect(toggle).toHaveAttribute("aria-pressed", "false");

        await toggle.click();
        await expect(page.locator("html")).toHaveClass(/aayntn-study/);
        await expect(page.locator(".aayntn-code__body").first()).toBeHidden();

        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveClass(/aayntn-study/);
        await expect(page.locator(".aayntn-code__body").first()).toBeHidden();
        await expect(page.locator("[data-study-toggle]")).toHaveAttribute("aria-pressed", "true");
    });

    test("fits the reading frame on a 390 pixel phone", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(TECHNIQUE, { waitUntil: "networkidle" });

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
    });
});
