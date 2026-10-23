/**
 * The homepage contract.
 *
 * The entrance has exactly five sections, and each one has a job: route the
 * reader, state what is finished, name the subjects, and open the laboratory.
 * These checks keep the shape from drifting as the copy changes.
 */
import { test, expect, type Page } from "@playwright/test";

async function openHome(page: Page): Promise<void> {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".aayntn-home")).toBeVisible();
}

test("renders exactly five sections", async ({ page }) => {
    await openHome(page);

    await expect(page.locator(".aayntn-home > section")).toHaveCount(5);
    await expect(page.locator(".aayntn-home-hero__title")).toContainText("A.A.Y.N.T.N.");

    const headings = await page.locator(".aayntn-home-section__title").allTextContents();
    expect(headings.map((heading) => heading.trim())).toEqual([
        "Choose a starting point",
        "Coverage",
        "Subjects",
        "Laboratories and languages",
    ]);
});

test("offers the three starting points", async ({ page }) => {
    await openHome(page);

    const cards = page.locator(".aayntn-home-path");
    await expect(cards).toHaveCount(3);

    await expect(cards.nth(0)).toContainText("I have never programmed");
    await expect(cards.nth(0)).toHaveAttribute("href", /\/start\/from-ap-csa\/$/);

    await expect(cards.nth(1)).toContainText("I am working on Bronze");
    await expect(cards.nth(1)).toHaveAttribute("href", /\/curriculum\/bronze\/$/);

    await expect(cards.nth(2)).toContainText("I know the basics");
    await expect(cards.nth(2)).toHaveAttribute("href", /\/algorithms\/$/);
});

test("renders the coverage figures and links to the report", async ({ page }) => {
    await openHome(page);

    const figures = page.locator(".aayntn-home-coverage__value");
    await expect(figures).toHaveCount(2);

    for (const text of await figures.allTextContents()) {
        expect(text.trim()).toMatch(/^\d+%$/);
    }

    await expect(page.locator(".aayntn-home-coverage__label").first()).toContainText(
        "Required techniques",
    );
    await expect(page.getByRole("link", { name: "Read the coverage report" })).toHaveAttribute(
        "href",
        /\/coverage\/$/,
    );
});

test("lists all fourteen subjects with technique counts", async ({ page }) => {
    await openHome(page);

    const subjects = page.locator(".aayntn-home-subject");
    await expect(subjects).toHaveCount(14);

    for (const count of await page.locator(".aayntn-home-subject__count").allTextContents()) {
        expect(count.trim()).toMatch(/^\d+$/);
    }
});

test("opens the command palette from the search prompt", async ({ page }) => {
    await openHome(page);

    await page.locator(".aayntn-home-search").click();
    await expect(page.locator(".aayntn-palette__dialog")).toBeVisible();
    await expect(page.getByLabel("Search query")).toBeVisible();
});

for (const width of [390, 768, 1440]) {
    test(`does not overflow sideways at ${width} pixels`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await openHome(page);

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(
            overflow,
            `the homepage overflows by ${overflow} pixels at ${width}`,
        ).toBeLessThanOrEqual(2);
    });
}
