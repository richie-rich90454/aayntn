/**
 * The interactive states of the style guide.
 *
 * Every control is hovered in both appearances and measured against the field
 * it actually paints. The rule is 4.5 to 1 for the text of the body, and no
 * purple ink is allowed on a blue field. A visited link must keep the color it
 * has at rest, and every focused control must show the focus ring.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";

const APPEARANCES = ["light", "dark"] as const;

interface Measurement {
    name: string;
    ratio: number;
    color: string;
    background: string;
    purpleOnBlue: boolean;
}

async function measureHovered(target: Locator): Promise<Measurement> {
    return target.evaluate((element: Element) => {
        interface Rgba {
            r: number;
            g: number;
            b: number;
            a: number;
        }

        const parse = (value: string): Rgba | null => {
            const match = value.match(/rgba?\(([^)]+)\)/);
            if (!match) return null;
            const parts = (match[1] ?? "").split(",").map((part) => Number.parseFloat(part.trim()));
            const [red = 0, green = 0, blue = 0, alpha = 1] = parts;
            return { r: red, g: green, b: blue, a: alpha };
        };

        const over = (top: Rgba, bottom: Rgba): Rgba => ({
            r: top.r * top.a + bottom.r * (1 - top.a),
            g: top.g * top.a + bottom.g * (1 - top.a),
            b: top.b * top.a + bottom.b * (1 - top.a),
            a: 1,
        });

        const field = (node: Element): Rgba => {
            const stack: Rgba[] = [];
            for (let current: Element | null = node; current; current = current.parentElement) {
                const background = parse(getComputedStyle(current).backgroundColor);
                if (background && background.a > 0) {
                    stack.push(background);
                    if (background.a === 1) break;
                }
            }
            let result: Rgba = { r: 255, g: 255, b: 255, a: 1 };
            for (let index = stack.length - 1; index >= 0; index -= 1) {
                const layer = stack[index];
                if (layer) result = over(layer, result);
            }
            return result;
        };

        const channel = (value: number): number => {
            const normalized = value / 255;
            return normalized <= 0.03928
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
        };

        const luminance = (value: Rgba): number =>
            0.2126 * channel(value.r) + 0.7152 * channel(value.g) + 0.0722 * channel(value.b);

        const text = element.querySelector("[data-state-text]") ?? element;
        const style = getComputedStyle(text);
        const color = parse(style.color) ?? { r: 0, g: 0, b: 0, a: 1 };
        const background = field(text);
        const painted = over(color, background);
        const first = luminance(painted);
        const second = luminance(background);
        const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

        return {
            name: (element.getAttribute("data-state") ?? element.className).slice(0, 48),
            ratio: Math.round(ratio * 100) / 100,
            color: style.color,
            background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(
                background.b,
            )})`,
            purpleOnBlue:
                background.b > background.r + 20 &&
                painted.b > painted.r + 10 &&
                painted.r > painted.g + 10,
        };
    });
}

async function setAppearance(page: Page, appearance: (typeof APPEARANCES)[number]): Promise<void> {
    await page.addInitScript((mode) => {
        window.localStorage.setItem("vitepress-theme-appearance", mode);
    }, appearance);
}

test.describe("the interactive states", () => {
    test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto("/style-guide/", { waitUntil: "domcontentloaded" });
        await page.locator('[data-appearance="dark"][data-ready="true"]').waitFor();
    });

    for (const appearance of APPEARANCES) {
        test(`every hover clears 4.5 to 1 in the ${appearance} appearance`, async ({ page }) => {
            const panel = page.locator(`[data-appearance="${appearance}"]`);
            const targets = panel.locator("[data-state]");
            const count = await targets.count();
            expect(count, "the state matrix is missing").toBeGreaterThan(24);

            const failures: string[] = [];

            for (let index = 0; index < count; index += 1) {
                const target = targets.nth(index);
                await target.evaluate((element) =>
                    element.scrollIntoView({ block: "center", inline: "nearest" }),
                );
                await target.hover();
                await page.waitForTimeout(20);
                const result = await measureHovered(target);

                if (result.ratio < 4.5) {
                    failures.push(
                        `${result.name}: ${result.ratio}:1, ${result.color} on ${result.background}`,
                    );
                }

                if (result.purpleOnBlue) {
                    failures.push(
                        `${result.name}: purple ink ${result.color} on blue ${result.background}`,
                    );
                }
            }

            expect(failures.slice(0, 12).join("\n"), `${failures.length} state(s) failed`).toBe("");
        });
    }

    test("a visited link keeps the color it has at rest", async ({ page }) => {
        await page.goto("/");
        await page.goto("/style-guide/");
        await page.locator('[data-appearance="dark"][data-ready="true"]').waitFor();

        const visited = page.locator("[data-visited-link]").first();
        const resting = page.locator("[data-resting-link]").first();

        const [visitedColor, restingColor] = await Promise.all([
            visited.evaluate((element) => getComputedStyle(element).color),
            resting.evaluate((element) => getComputedStyle(element).color),
        ]);

        expect(visitedColor).toBe(restingColor);
        expect(visitedColor).not.toBe("rgb(85, 26, 139)");
    });

    for (const appearance of APPEARANCES) {
        test(`the focus ring is visible in the ${appearance} appearance`, async ({ page }) => {
            await setAppearance(page, appearance);
            await page.goto("/style-guide/");
            await page.locator('[data-appearance="dark"][data-ready="true"]').waitFor();

            await page.evaluate(() => {
                const active = document.activeElement;
                if (active instanceof HTMLElement) active.blur();
            });

            let found = false;
            for (let step = 0; step < 120; step += 1) {
                await page.keyboard.press("Tab");
                found = await page.evaluate(
                    () => document.activeElement?.hasAttribute("data-focus-target") ?? false,
                );
                if (found) break;
            }

            expect(found, "the focus target was never reached by the keyboard").toBe(true);

            const ring = await page
                .locator("[data-focus-target]")
                .first()
                .evaluate((element) => {
                    const style = getComputedStyle(element);
                    return {
                        visible: element.matches(":focus-visible"),
                        outlineStyle: style.outlineStyle,
                        outlineWidth: Number.parseFloat(style.outlineWidth),
                        outlineColor: style.outlineColor,
                        outlineOffset: Number.parseFloat(style.outlineOffset),
                    };
                });

            expect(ring.visible).toBe(true);
            expect(ring.outlineStyle).toBe("solid");
            expect(ring.outlineWidth).toBeGreaterThanOrEqual(2);
            expect(ring.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
            expect(ring.outlineColor).not.toBe("transparent");
            expect(ring.outlineOffset).toBeGreaterThanOrEqual(0);
        });
    }
});
