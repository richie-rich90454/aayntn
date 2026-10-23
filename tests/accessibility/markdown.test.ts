/**
 * The accessibility rules that can be checked without a browser.
 *
 * A technical reference is read by people who navigate with a keyboard and by
 * people who use a screen reader, so the structural rules are checked in the
 * build rather than left to a reviewer's eye.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { DOCS_DIR, ROOT, parseMarkdownFrontmatter } from "../../tools/lib/paths";

async function pages(): Promise<{ file: string; body: string }[]> {
    const files = await fg("**/*.md", { cwd: DOCS_DIR, absolute: true, onlyFiles: true });
    const result: { file: string; body: string }[] = [];
    for (const file of files) {
        const relative = file.replace(/\\/g, "/").replace(`${ROOT.replace(/\\/g, "/")}/`, "");
        if (relative.includes("/docs/implementations/")) continue;
        const source = await readFile(file, "utf8");
        const parsed = parseMarkdownFrontmatter(source);
        result.push({ file: relative, body: parsed ? parsed.body : source });
    }
    return result;
}

describe("the heading structure", () => {
    it("never skips a level", async () => {
        for (const page of await pages()) {
            const headings = [...page.body.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
                level: match[1]!.length,
                text: match[2]!.trim(),
            }));
            let previous = 0;
            for (const heading of headings) {
                if (previous > 0 && heading.level > previous + 1) {
                    expect(
                        heading.level,
                        `${page.file} jumps from level ${previous} to level ${heading.level} at "${heading.text}"`,
                    ).toBeLessThanOrEqual(previous + 1);
                }
                previous = heading.level;
            }
        }
    });

    it("gives every page exactly one first-level heading", async () => {
        for (const page of await pages()) {
            const firsts = [...page.body.matchAll(/^#\s+(.+)$/gm)];
            const inProse = page.body.replace(/```[\s\S]*?```/g, "");
            const proseFirsts = [...inProse.matchAll(/^#\s+(.+)$/gm)];
            expect(
                proseFirsts.length,
                `${page.file} has ${proseFirsts.length} first-level headings`,
            ).toBeLessThanOrEqual(1);
            void firsts;
        }
    });
});

describe("the images", () => {
    it("gives every image an alternative text", async () => {
        for (const page of await pages()) {
            const prose = page.body.replace(/```[\s\S]*?```/g, "");
            for (const match of prose.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
                expect(
                    match[1]!.length,
                    `${page.file} has an image without alternative text`,
                ).toBeGreaterThan(0);
            }
        }
    });
});

describe("the links", () => {
    it("gives every link some text", async () => {
        for (const page of await pages()) {
            const prose = page.body.replace(/```[\s\S]*?```/g, "");
            for (const match of prose.matchAll(/\[([^\]]*)\]\([^)]*\)/g)) {
                expect(match[1]!.length, `${page.file} has a link with no text`).toBeGreaterThan(0);
            }
        }
    });
});

describe("the tables", () => {
    it("gives every table a header row", async () => {
        for (const page of await pages()) {
            const prose = page.body.replace(/```[\s\S]*?```/g, "");
            const tables = prose.split(/\n\s*\|\s*\n/).filter((block) => block.includes("|"));
            for (const table of tables) {
                const rows = table.split("\n").filter((row) => row.trim().startsWith("|"));
                if (rows.length === 0) continue;
                const header = rows[0]!;
                const cells = header.split("|").filter((cell) => cell.trim().length > 0);
                expect(
                    cells.length,
                    `${page.file} has a table whose first row is not a header`,
                ).toBeGreaterThan(0);
            }
        }
    });
});

describe("the mathematical panels", () => {
    it("gives every panel a type and a title", async () => {
        const allowed = new Set([
            "definition",
            "lemma",
            "theorem",
            "proof",
            "invariant",
            "recurrence",
            "counterexample",
            "complexity",
        ]);
        for (const page of await pages()) {
            for (const match of page.body.matchAll(/<MathPanel\s+([^>]*)>/g)) {
                const attributes = match[1]!;
                expect(attributes, `${page.file} has a MathPanel without a type`).toMatch(/type=/);
                expect(attributes, `${page.file} has a MathPanel without a title`).toMatch(
                    /title=/,
                );
                const type = /type="([^"]+)"/.exec(attributes)?.[1];
                expect(type, `${page.file} has a MathPanel with an unknown type`).toBeTruthy();
                expect(
                    allowed.has(type!),
                    `${page.file} has a MathPanel with the unknown type "${type}"`,
                ).toBe(true);
            }
        }
    });
});

describe("the components", () => {
    it("uses only the components the theme registers", async () => {
        const registered = new Set([
            "AlgorithmSummary",
            "AlgorithmPlayer",
            "Banner",
            "CodeViewer",
            "ContestSimulation",
            "CoverageMatrix",
            "Figure",
            "LearnNext",
            "MathPanel",
            "Ornament",
            "PracticeCatalog",
            "PrerequisiteGraph",
            "ProgressDashboard",
            "StyleGuide",
            "Synonyms",
        ]);
        for (const page of await pages()) {
            for (const match of page.body.matchAll(/<([A-Z][A-Za-z]+)\s/g)) {
                const name = match[1]!;
                // A component that is not registered is silently dropped by the
                // renderer, so it must be caught here.
                expect(
                    registered.has(name),
                    `${page.file} uses the unregistered component <${name}>`,
                ).toBe(true);
            }
        }
    });
});
