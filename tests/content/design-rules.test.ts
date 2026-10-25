/**
 * The rules of the design.
 *
 * These are the rules that the eye enforces, and they are enforced here so
 * that a change cannot quietly break one of them. They are checked across
 * the whole theme and the whole set of articles, not in one place, because a
 * rule that holds only where it was written is not a rule.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { ROOT } from "../../tools/lib/paths";

/** The files that carry the design. */
async function themeFiles(): Promise<string[]> {
    return fg("**/*.{css,vue,ts}", {
        cwd: join(ROOT, "docs/.vitepress/theme"),
        absolute: true,
        onlyFiles: true,
    });
}

/** The articles of the encyclopedia. */
async function articles(): Promise<string[]> {
    return fg("**/*.md", {
        cwd: join(ROOT, "docs/algorithms"),
        absolute: true,
        onlyFiles: true,
    });
}

describe("the design", () => {
    it("writes the name of the encyclopedia the same way everywhere", async () => {
        const files = await fg("**/*.{vue,ts,tsx,md,css,html,json}", {
            cwd: ROOT,
            ignore: [
                "node_modules/**",
                ".tmp/**",
                "docs/.vitepress/dist/**",
                "docs/public/**",
                "docs/.vitepress/data/**",
            ],
        });
        for (const file of files) {
            const source = await readFile(file, "utf8");
            for (const match of source.matchAll(/A\.A\.Y\.N\.T\.N(?!\.)|\bAAYTN\b/g)) {
                expect(
                    match[0],
                    `${file.replace(ROOT + "\\", "")} writes the name as "${match[0]}"`,
                ).toBe("A.A.Y.N.T.N.");
            }
        }
    });

    it("uses only the typefaces that the repository bundles", async () => {
        for (const file of await themeFiles()) {
            const source = await readFile(file, "utf8");
            if (!file.endsWith(".css")) continue;
            for (const match of source.matchAll(/font-family:\s*([^;]+);/g)) {
                for (const family of match[1]!.split(",")) {
                    const name = family.trim().replace(/^["']|["']$/g, "");
                    // A variable names a family that is set in the tokens, and
                    // a face declaration names one family and no fallback.
                    if (name.startsWith("var(")) continue;
                    if (name === "Noto Sans" || name === "Noto Sans Mono") continue;
                    expect(
                        name,
                        `${file.replace(ROOT + "\\", "")} asks for the typeface ${name}`,
                    ).toBe("Noto Sans");
                }
            }
        }
    });

    it("never shouts the text", async () => {
        for (const file of await themeFiles()) {
            const source = await readFile(file, "utf8");
            expect(
                /text-transform:\s*uppercase/i.test(source),
                `${file.replace(ROOT + "\\", "")} shouts the text`,
            ).toBe(false);
        }
    });

    it("never marks a callout with a left-only border", async () => {
        const callout =
            /aayntn-math|aayntn-note|aayntn-hint|aayntn-variant-note|aayntn-contest__notice|book-panel|book-note|blockquote/;
        for (const file of await themeFiles()) {
            if (!file.endsWith(".css") && !file.endsWith(".vue")) continue;
            const source = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
            for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
                const selector = match[1]!.trim();
                if (!callout.test(selector)) continue;
                expect(
                    /border-left\s*:|border-inline-start\s*:/.test(match[2]!),
                    `${file.replace(ROOT + "\\", "")} gives ${selector} a left-only border`,
                ).toBe(false);
            }
        }
    });

    it("places the raw implementation directly below the description", async () => {
        for (const file of await articles()) {
            const source = await readFile(file, "utf8");
            const summary = source.indexOf("<AlgorithmSummary");
            const viewer = source.indexOf("<CodeViewer");
            if (summary === -1 || viewer === -1) continue;
            expect(
                viewer > summary,
                `${file.replace(ROOT + "\\", "")} puts the code before the description`,
            ).toBe(true);
            expect(
                viewer - summary,
                `${file.replace(ROOT + "\\", "")} puts the code too far below the description`,
            ).toBeLessThan(400);
        }
    });
});
