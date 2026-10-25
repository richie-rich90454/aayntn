/**
 * The bundle budget.
 *
 * The entry bundle must stay small and must not carry the generated
 * catalogues. A single article is allowed a large content chunk because the
 * server-rendered mathematics lives there; every chunk still has a ceiling.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { test, expect } from "@playwright/test";

const ASSETS = join(process.cwd(), "docs/.vitepress/dist/assets");
const files = readdirSync(ASSETS).filter((file) => file.endsWith(".js"));

function source(file: string): string {
    return readFileSync(join(ASSETS, file), "utf8");
}

function compressed(file: string): number {
    return gzipSync(readFileSync(join(ASSETS, file)), { level: 9 }).length;
}

test.describe("the bundle", () => {
    test("keeps the entry small and free of the generated catalogues", () => {
        const entry = files.find((file) => file.startsWith("app."));
        expect(entry, "the entry chunk is missing").toBeDefined();

        const size = statSync(join(ASSETS, entry!)).size;
        expect(size, `the entry chunk is ${Math.round(size / 1024)} KB`).toBeLessThan(250 * 1024);
        const packed = compressed(entry!);
        expect(
            packed,
            `the entry chunk is ${Math.round(packed / 1024)} KB compressed`,
        ).toBeLessThan(60 * 1024);

        const text = source(entry!);
        expect(text).not.toContain("auxiliarySpace");
        expect(text).not.toContain("editorialUrl");
    });

    test("gives an article only its own algorithm document", () => {
        const article = files.find(
            (file) => file.startsWith("algorithms_graphs_dijkstra.md.") && !file.includes(".lean."),
        );
        expect(article, "the Dijkstra content chunk is missing").toBeDefined();

        const text = source(article!);
        const variants = text.split("auxiliarySpace").length - 1;
        expect(variants).toBeGreaterThan(0);
        expect(variants).toBeLessThan(50);
        expect(text).not.toContain("editorialUrl");
    });

    test("keeps the first-paint chunks small", () => {
        const lean = files
            .filter((file) => file.endsWith(".lean.js"))
            .map((file) => ({ file, size: compressed(file) }))
            .sort((left, right) => right.size - left.size)[0]!;
        expect(
            lean.size,
            `${lean.file} is ${Math.round(lean.size / 1024)} KB compressed`,
        ).toBeLessThan(40 * 1024);
    });

    test("keeps every chunk inside the content ceiling", () => {
        const largest = files
            .map((file) => ({ file, size: statSync(join(ASSETS, file)).size }))
            .sort((left, right) => right.size - left.size)[0]!;
        expect(
            largest.size,
            `${largest.file} is ${Math.round(largest.size / 1024)} KB`,
        ).toBeLessThan(900 * 1024);
    });
});
