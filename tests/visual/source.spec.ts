/**
 * The source archive.
 *
 * The page ships the exact source as plain text and fetches the highlighted
 * fragment when a listing approaches the viewport. The source must be complete
 * either way, the color must follow the appearance, and the page must stay
 * inside the viewport at every width.
 */
import { test, expect } from "@playwright/test";

test.describe("the source archive", () => {
    test("colors a listing without losing a byte of it", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
        });

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/implementations/graphs-dijkstra/", { waitUntil: "networkidle" });

        const highlighted = page.locator(".aayntn-source--highlighted").first();
        await expect(highlighted).toBeVisible();
        await expect(highlighted).toContainText("#include");

        const light = await highlighted
            .locator("span[style*='--shiki-light']")
            .first()
            .evaluate((element) => getComputedStyle(element).color);

        await page.addInitScript(() =>
            window.localStorage.setItem("vitepress-theme-appearance", "dark"),
        );
        await page.reload({ waitUntil: "networkidle" });

        const dark = await page
            .locator(".aayntn-source--highlighted span[style*='--shiki-dark']")
            .first()
            .evaluate((element) => getComputedStyle(element).color);

        expect(dark).not.toBe(light);
        expect(errors).toEqual([]);
    });

    test("keeps the plain source and colors the rest as it arrives", async ({ page }) => {
        await page.goto("/implementations/graphs-dijkstra/", { waitUntil: "networkidle" });

        const blocks = page.locator(".aayntn-source");
        const count = await blocks.count();
        expect(count).toBeGreaterThan(6);

        await blocks.first().scrollIntoViewIfNeeded();
        await expect(page.locator(".aayntn-source--highlighted").first()).toBeVisible();

        for (let index = 0; index < count; index += 1) {
            await blocks.nth(index).scrollIntoViewIfNeeded();
            await page.waitForTimeout(80);
        }
        await expect(page.locator(".aayntn-source--highlighted")).toHaveCount(count, {
            timeout: 20_000,
        });
    });
});
