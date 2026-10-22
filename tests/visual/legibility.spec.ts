/**
 * The legibility of the published site.
 *
 * Every piece of text on a page is measured against the field it stands on,
 * in the light appearance and in the dark one. The rule is the one of the
 * Web Content Accessibility Guidelines: four and a half to one for the text
 * of the body, and three to one for the text that is large.
 *
 * The measurement is of what the reader sees, and not of the palette, so it
 * catches a field that was put on the wrong ground as well as a color that
 * was chosen too close to another.
 */
import { test, expect } from "@playwright/test";

/** The pages that carry the most of the design between them. */
const PAGES = [
    "/",
    "/algorithms/",
    "/algorithms/graphs/dijkstra/",
    "/algorithms/graphs/",
    "/algorithms/dynamic-programming/interval-dp/",
    "/practice/",
    "/progress/",
    "/contest/",
    "/laboratory/",
    "/languages/cpp17/",
    "/start/from-ap-csa/",
    "/reference/glossary/",
];

const APPEARANCES = [
    { name: "light", dark: false },
    { name: "dark", dark: true },
];

test.describe("the legibility of the site", () => {
    for (const appearance of APPEARANCES) {
        test(`every word is legible in the ${appearance.name} appearance`, async ({ page }) => {
            await page.addInitScript((mode) => {
                window.localStorage.setItem("vitepress-theme-appearance", mode);
            }, appearance.name);

            const failures: string[] = [];

            for (const path of PAGES) {
                await page.setViewportSize({ width: 1440, height: 1000 });
                await page.goto(path, { waitUntil: "domcontentloaded" });
                await page.waitForTimeout(80);

                const problems = (await page.evaluate(`(() => {
                    const parse = (value) => {
                        const match = value.match(/rgba?\\(([^)]+)\\)/);
                        if (!match) return null;
                        const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
                        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] === undefined ? 1 : parts[3] };
                    };
                    const over = (top, bottom) => ({
                        r: top.r * top.a + bottom.r * (1 - top.a),
                        g: top.g * top.a + bottom.g * (1 - top.a),
                        b: top.b * top.a + bottom.b * (1 - top.a),
                        a: 1,
                    });
                    const field = (element) => {
                        const stack = [];
                        for (let node = element; node; node = node.parentElement) {
                            const background = parse(getComputedStyle(node).backgroundColor);
                            if (background && background.a > 0) {
                                stack.push(background);
                                if (background.a === 1) break;
                            }
                        }
                        let result = { r: 255, g: 255, b: 255, a: 1 };
                        for (let index = stack.length - 1; index >= 0; index -= 1) {
                            result = over(stack[index], result);
                        }
                        return result;
                    };
                    const channel = (value) => {
                        const c = value / 255;
                        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
                    };
                    const luminance = (color) =>
                        0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
                    const ratio = (a, b) => {
                        const lighter = Math.max(luminance(a), luminance(b));
                        const darker = Math.min(luminance(a), luminance(b));
                        return (lighter + 0.05) / (darker + 0.05);
                    };
                    const out = [];
                    for (const element of Array.from(document.querySelectorAll("body *"))) {
                        const text = Array.from(element.childNodes)
                            .filter((node) => node.nodeType === 3)
                            .map((node) => node.textContent.trim())
                            .join(" ")
                            .trim();
                        if (!text) continue;
                        const box = element.getBoundingClientRect();
                        if (box.width === 0 || box.height === 0) continue;
                        const style = getComputedStyle(element);
                        if (style.visibility === "hidden" || style.opacity === "0") continue;
                        const color = parse(style.color);
                        if (!color || color.a === 0) continue;
                        const size = parseFloat(style.fontSize);
                        const bold = Number(style.fontWeight) >= 700;
                        const needed = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
                        const background = field(element);
                        const value = ratio(over(color, background), background);
                        if (value < needed) {
                            out.push({
                                text: text.slice(0, 40),
                                value: Math.round(value * 100) / 100,
                                needed,
                                where:
                                    element.tagName.toLowerCase() +
                                    "." +
                                    String(element.className || "").split(" ")[0],
                            });
                        }
                    }
                    return out;
                })()`)) as { text: string; value: number; needed: number; where: string }[];

                for (const problem of problems) {
                    failures.push(
                        `${path} [${problem.value} < ${problem.needed}] ${problem.where} "${problem.text}"`,
                    );
                }
            }

            expect(
                failures.slice(0, 12).join("\n"),
                `${failures.length} word(s) below the threshold in the ${appearance.name} appearance`,
            ).toBe("");
        });
    }
});
