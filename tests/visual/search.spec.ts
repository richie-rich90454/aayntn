/**
 * The command palette, end to end.
 *
 * These checks exercise the paths a reader actually uses: the keyboard
 * shortcut, the filters, moving through the result list, Escape, and the
 * recent pages that survive a navigation.
 */

import { test, expect, type Page } from "@playwright/test";

const PALETTE = ".aayntn-palette";
const TRIGGER = ".aayntn-search__button";
const RESULT = ".aayntn-palette__result";

async function openPalette(page: Page): Promise<void> {
    await page.goto("/algorithms/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+K");
    await expect(page.locator(PALETTE)).toBeVisible();
    await expect(page.getByLabel("Search query")).toBeFocused();
}

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
});

test("opens with Ctrl+K, the trigger and the slash key", async ({ page }) => {
    await openPalette(page);

    await page.keyboard.press("Escape");
    await expect(page.locator(PALETTE)).toBeHidden();

    await page.locator(TRIGGER).click();
    await expect(page.locator(PALETTE)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(PALETTE)).toBeHidden();

    await page.keyboard.press("/");
    await expect(page.locator(PALETTE)).toBeVisible();
});

test("filters the results by division", async ({ page }) => {
    await openPalette(page);

    await page.getByLabel("Division").selectOption("gold");
    await expect(page.locator(".aayntn-palette__count")).toHaveText("1 active");

    const results = page.locator(RESULT);
    await expect(results.first()).toBeVisible();
    const divisions = await results.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-divisions") ?? ""),
    );
    expect(divisions.length).toBeGreaterThan(0);
    expect(divisions.every((value) => value.split(" ").includes("gold"))).toBe(true);
});

test("moves with ArrowDown and opens with Enter", async ({ page }) => {
    await openPalette(page);

    await page.getByLabel("Kind").selectOption("reference");
    await page.getByLabel("Search query").fill("tree");
    const second = page.locator(RESULT).nth(1);
    await expect(second).toBeVisible();

    const target = await second.getAttribute("href");
    expect(target).not.toBeNull();
    const targetPath = new URL(target!, page.url()).pathname.replace(/\/$/, "");

    const field = page.getByLabel("Search query");
    await field.press("ArrowDown");
    await field.press("Enter");

    await expect(page.locator(PALETTE)).toBeHidden();
    await expect(page).toHaveURL((url) => url.pathname.replace(/\/$/, "") === targetPath);
});

test("restores focus to the trigger on Escape", async ({ page }) => {
    await openPalette(page);

    await page.keyboard.press("Escape");

    await expect(page.locator(PALETTE)).toBeHidden();
    await expect(page.locator(TRIGGER)).toBeFocused();
});

test("shows the recently opened pages on the second open", async ({ page }) => {
    await openPalette(page);

    await page.getByLabel("Search query").fill("disjoint set union");
    const first = page.locator(RESULT).first();
    await expect(first).toBeVisible();
    const title = (await first.locator(".aayntn-palette__title-text").textContent())?.trim();
    const target = new URL((await first.getAttribute("href"))!, page.url());
    expect(title).toBeTruthy();

    await first.click();
    await expect(page.locator(PALETTE)).toBeHidden();
    await expect(page).toHaveURL(
        (url) => url.pathname === target.pathname && url.hash === target.hash,
    );

    await page.keyboard.press("Control+K");
    await expect(page.locator(PALETTE)).toBeVisible();
    await expect(page.getByText("Recent", { exact: true })).toBeVisible();
    await expect(page.locator(".aayntn-palette__results")).toContainText(title!);
});

test("produces no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await openPalette(page);
    await page.getByLabel("Search query").fill("graph");
    await page.getByLabel("Division").selectOption("silver");
    await page.getByLabel("Kind").selectOption("reference");
    await page.keyboard.press("Escape");
    await expect(page.locator(PALETTE)).toBeHidden();

    expect(errors).toEqual([]);
});
