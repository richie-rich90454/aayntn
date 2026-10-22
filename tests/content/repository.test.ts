/**
 * The content must satisfy the same rules the build enforces, and a few that
 * the build cannot check.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { DOCS_DIR, ROOT, parseMarkdownFrontmatter } from "../../tools/lib/paths";
import { lessonFrontmatterSchema } from "../../tools/lib/schema";

const BRITISH = [
    "behaviour",
    "colour",
    "analyse",
    "initialis",
    "summaris",
    "recognis",
    "optimis",
    "organis",
    "normalis",
    "visualis",
    "serialis",
    "centre",
    "practise",
    "catalogue",
    "artefact",
    "licence",
    "grey",
    "specialis",
    "utilis",
    "minimis",
    "maximis",
    "labelled",
    "travell",
    "modell",
    "cancelled",
    "fulfil",
    "enquir",
    "whilst",
    "amongst",
    "learnt",
    "judgement",
    "acknowledgement",
    "marvellous",
    "signall",
    "levell",
    "programme",
    "favour",
    "emphasise",
    "neighbour",
    "towards",
    "cancelling",
    "utilis",
    "prioritis",
    "authoris",
];

async function markdownFiles(): Promise<string[]> {
    const files = await fg("**/*.md", { cwd: DOCS_DIR, absolute: true, onlyFiles: true });
    // The generated source pages are rebuilt from the implementations, so they
    // are checked by the build rather than by this test.
    return files.filter((file) => !file.replace(/\\/g, "/").includes("/implementations/"));
}

describe("every lesson", () => {
    it("has valid frontmatter", async () => {
        for (const file of await markdownFiles()) {
            const source = await readFile(file, "utf8");
            const parsed = parseMarkdownFrontmatter(source);
            if (!parsed) continue;
            const result = lessonFrontmatterSchema.safeParse(parsed.data);
            expect(
                result.success,
                `${file.replace(ROOT + "\\", "")}: ${result.success ? "" : result.error.issues[0]?.message}`,
            ).toBe(true);
        }
    });

    it("is written in American English", async () => {
        for (const file of await markdownFiles()) {
            const source = await readFile(file, "utf8");
            const lower = source.toLowerCase();
            for (const spelling of BRITISH) {
                const index = lower.indexOf(spelling);
                expect(
                    index,
                    `${file.replace(ROOT + "\\", "")} contains the British spelling "${spelling}"`,
                ).toBe(-1);
            }
        }
    });

    it("uses sentence case for its headings", async () => {
        for (const file of await markdownFiles()) {
            const source = await readFile(file, "utf8");
            const headings = [...source.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) =>
                match[1]!.trim(),
            );
            for (const heading of headings) {
                const letters = heading.replace(/[^A-Za-z]/g, "");
                if (letters.length < 4) continue;
                const isAllUpper = letters === letters.toUpperCase();
                expect(
                    isAllUpper,
                    `${file.replace(ROOT + "\\", "")} has an all-uppercase heading: "${heading}"`,
                ).toBe(false);
            }
        }
    });

    it("does not use a centered dot as a separator", async () => {
        for (const file of await markdownFiles()) {
            const source = await readFile(file, "utf8");
            expect(source.includes(" · ")).toBe(false);
        }
    });
});

describe("the source code", () => {
    it("is written in American English", async () => {
        const files = await fg("**/*.{c,cpp,h,java,py,pas,js}", {
            cwd: join(ROOT, "implementations"),
            absolute: true,
            onlyFiles: true,
        });
        for (const file of files) {
            const source = (await readFile(file, "utf8")).toLowerCase();
            for (const spelling of [
                "behaviour",
                "colour",
                "initialis",
                "optimis",
                "analyse",
                "centre",
                "neighbour",
            ]) {
                expect(
                    source.includes(spelling),
                    `${file.replace(ROOT + "\\", "")}: "${spelling}"`,
                ).toBe(false);
            }
        }
    });

    it("is written in American English in the theme as well", async () => {
        const files = await fg("**/*.{ts,vue,css}", {
            cwd: join(ROOT, "docs/.vitepress/theme"),
            absolute: true,
            onlyFiles: true,
        });
        for (const file of files) {
            const source = (await readFile(file, "utf8")).toLowerCase();
            for (const spelling of [
                "behaviour",
                "colour",
                "initialis",
                "optimis",
                "analyse",
                "centre",
                "neighbour",
            ]) {
                expect(
                    source.includes(spelling),
                    `${file.replace(ROOT + "\\", "")}: "${spelling}"`,
                ).toBe(false);
            }
        }
    });

    it("marks the educational languages as such", async () => {
        const files = await fg("**/*.{pas,js}", {
            cwd: join(ROOT, "implementations"),
            absolute: true,
            onlyFiles: true,
        });
        for (const file of files) {
            const source = await readFile(file, "utf8");
            expect(
                /educational reference/i.test(source),
                `${file.replace(ROOT + "\\", "")} must say that it is an educational reference implementation`,
            ).toBe(true);
        }
    });
});

describe("the problem catalogue", () => {
    it("gives every problem a hint ladder and a difficulty", async () => {
        const files = await fg("*.yaml", {
            cwd: join(ROOT, "data", "problems"),
            absolute: true,
            onlyFiles: true,
        });
        for (const file of files) {
            const record = parseYaml(await readFile(file, "utf8")) as {
                id: string;
                difficulty: number;
                hints: string[];
                techniques: string[];
            };
            expect(record.hints.length, `${record.id} has no hints`).toBeGreaterThan(0);
            expect(record.techniques.length, `${record.id} names no techniques`).toBeGreaterThan(0);
            expect(record.difficulty).toBeGreaterThanOrEqual(1);
            expect(record.difficulty).toBeLessThanOrEqual(5);
        }
    });
});
