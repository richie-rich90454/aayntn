/**
 * The one radius.
 *
 * Every bordered control and surface reads the same token. These checks pin
 * the default to 5 pixels on the style guide, and prove that the live radius
 * control rewrites the document element rather than one specimen.
 */
import { test, expect } from "@playwright/test";

const TARGETS = [
    { name: "button", selector: ".aayntn-button" },
    { name: "chip", selector: ".aayntn-chip" },
    { name: "feature card", selector: ".aayntn-feature" },
    { name: "progress card", selector: ".aayntn-progress__card" },
    { name: "code block", selector: ".aayntn-code" },
];

async function radiusOf(page: import("@playwright/test").Page, selector: string): Promise<string> {
    return page
        .locator(selector)
        .first()
        .evaluate((element) => getComputedStyle(element).borderRadius);
}

test.describe("the one radius", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto("/style-guide/", { waitUntil: "domcontentloaded" });
        await page.locator('[data-appearance="dark"][data-ready="true"]').waitFor();
    });

    for (const target of TARGETS) {
        test(`the ${target.name} reads 5 pixels`, async ({ page }) => {
            await expect(page.locator(target.selector).first()).toBeVisible();
            expect(await radiusOf(page, target.selector)).toBe("5px");
        });
    }

    test("a table cell stays square", async ({ page }) => {
        const cell = page.locator(".aayntn-sg-palette td").first();
        await expect(cell).toBeVisible();
        expect(await cell.evaluate((element) => getComputedStyle(element).borderRadius)).toBe(
            "0px",
        );
    });

    test("the slider rewrites the radius on the document element", async ({ page }) => {
        const slider = page.locator("#aayntn-radius");
        await expect(slider).toBeVisible();

        await slider.evaluate((element) => {
            const input = element as HTMLInputElement;
            input.value = "24";
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });

        await expect(page.locator(".aayntn-sg-radius__line")).toHaveText("--radius: 24px;");
        expect(await radiusOf(page, ".aayntn-button")).toBe("24px");
        expect(await radiusOf(page, ".aayntn-code")).toBe("24px");

        const token = await page.evaluate(() =>
            document.documentElement.style.getPropertyValue("--radius"),
        );
        expect(token).toBe("24px");
    });
});
