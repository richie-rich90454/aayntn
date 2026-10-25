/**
 * Every algorithm article must show its implementation, not merely link to the
 * archive. These checks open each article, wait for the highlighted listing,
 * and then walk every language and variant of one twelve-listing algorithm.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import type { AlgorithmEntry } from "../../docs/.vitepress/data/types";

const algorithms = JSON.parse(
    readFileSync(join(process.cwd(), "docs/.vitepress/data/generated/algorithms.json"), "utf8"),
) as AlgorithmEntry[];

const LANGUAGE_ORDER = ["c", "cpp17", "java", "python", "pascal", "javascript"] as const;

const bySubject = new Map<string, AlgorithmEntry[]>();
for (const algorithm of algorithms) {
    const subject = algorithm.id.split(".")[0]!;
    bySubject.set(subject, (bySubject.get(subject) ?? []).concat(algorithm));
}

test.describe("the algorithm articles", () => {
    for (const [subject, entries] of bySubject) {
        test(`embed a working code viewer on every ${subject} page`, async ({ page }) => {
            test.setTimeout(5 * 60_000);
            const failures: string[] = [];

            for (const algorithm of entries) {
                const errors: string[] = [];
                const onPageError = (error: Error) => errors.push(error.message);
                const onConsole = (message: { type(): string; text(): string }) => {
                    if (message.type() === "error") errors.push(message.text());
                };
                page.on("pageerror", onPageError);
                page.on("console", onConsole);

                try {
                    if (!algorithm.href) throw new Error("the generated entry has no href");
                    await page.goto(algorithm.href, { waitUntil: "domcontentloaded" });
                    const viewer = page.locator(".aayntn-code").first();
                    await expect(viewer).toBeVisible({ timeout: 15_000 });
                    await expect(viewer.locator(".aayntn-code__body .shiki")).toBeVisible({
                        timeout: 15_000,
                    });

                    const file = (await viewer.locator(".aayntn-code__file").textContent())?.trim();
                    if (!algorithm.variants.some((variant) => variant.file === file)) {
                        failures.push(`${algorithm.id}: the viewer shows ${file}`);
                    }
                    if (errors.length) failures.push(`${algorithm.id}: ${errors.join("; ")}`);
                } catch (error) {
                    failures.push(`${algorithm.id}: ${(error as Error).message.split("\n")[0]}`);
                } finally {
                    page.off("pageerror", onPageError);
                    page.off("console", onConsole);
                }
            }

            expect(failures).toEqual([]);
        });
    }

    test("loads every language and every variant", async ({ page }) => {
        const algorithm = algorithms.find((entry) => entry.id === "graphs.dijkstra");
        expect(algorithm?.href).toBeTruthy();

        await page.goto(algorithm!.href!, { waitUntil: "networkidle" });
        const languages = LANGUAGE_ORDER.filter((language) =>
            algorithm!.variants.some((variant) => variant.language === language),
        );
        const languageTabs = page.locator('[aria-label="Implementation language"] [role="tab"]');
        const variantTabs = page.locator('[aria-label="Implementation variant"] [role="tab"]');

        for (let languageIndex = 0; languageIndex < languages.length; languageIndex += 1) {
            const language = languages[languageIndex]!;

            if ((await languageTabs.nth(languageIndex).getAttribute("aria-selected")) !== "true") {
                const response = page.waitForResponse((candidate) =>
                    candidate.url().includes(`/implementations/graphs.dijkstra/${language}.`),
                );
                await languageTabs.nth(languageIndex).click();
                await response;
            }

            const variants = algorithm!.variants.filter((variant) => variant.language === language);

            for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
                const variant = variants[variantIndex]!;

                if (variants.length > 1) {
                    if (
                        (await variantTabs.nth(variantIndex).getAttribute("aria-selected")) !==
                        "true"
                    ) {
                        const response = page.waitForResponse((candidate) =>
                            candidate
                                .url()
                                .includes(
                                    `/implementations/graphs.dijkstra/${language}.${variant.id}.html`,
                                ),
                        );
                        await variantTabs.nth(variantIndex).click();
                        await response;
                    }
                }

                await expect(page.locator(".aayntn-code__file")).toHaveText(variant.file);
                await expect(page.locator(".aayntn-code__body .shiki")).toBeVisible();
                const source = await page.locator(".aayntn-code__body").textContent();
                expect(source?.trim().length ?? 0).toBeGreaterThan(0);
            }
        }
    });
});
