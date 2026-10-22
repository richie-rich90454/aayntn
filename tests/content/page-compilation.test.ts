/**
 * Every page must compile.
 *
 * A page is Markdown that becomes a Vue template, so an element that is never
 * closed, or a piece of mathematics that Markdown reads as an HTML tag, is a
 * build failure. The message the compiler prints points at a character
 * offset in the rendered page rather than at the line in the source, so the
 * failure is caught here instead, where the source can be named.
 */
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { compile } from "@vue/compiler-dom";
import { createMarkdownRenderer } from "vitepress";
import { katex } from "@mdit/plugin-katex";
import fg from "fast-glob";
import { DOCS_DIR, ROOT } from "../../tools/lib/paths";
import { katexMacros } from "../../docs/.vitepress/theme/katex-macros";

const renderer = await createMarkdownRenderer(ROOT, {
    math: false,
    lineNumbers: false,
    config(md) {
        md.use(katex as never, {
            delimiters: "dollars",
            throwOnError: false,
            errorColor: "#C63D32",
            strict: false,
            trust: false,
            macros: katexMacros,
        });
    },
});

async function sources(): Promise<{ file: string; source: string }[]> {
    const files = await fg("**/*.md", {
        cwd: DOCS_DIR,
        absolute: true,
        onlyFiles: true,
        ignore: ["implementations/**", ".vitepress/**"],
    });

    const result: { file: string; source: string }[] = [];
    for (const file of files) {
        result.push({
            file: file.replace(/\\/g, "/").replace(`${ROOT.replace(/\\/g, "/")}/`, ""),
            source: await readFile(file, "utf8"),
        });
    }
    return result;
}

describe("the pages", () => {
    it("all compile as templates", async () => {
        for (const page of await sources()) {
            const html = renderer.render(page.source);
            let message = "";
            try {
                compile(html, {
                    onError(error) {
                        throw error;
                    },
                });
            } catch (error) {
                message = (error as Error).message;
            }
            expect(message, `${page.file} does not compile: ${message}`).toBe("");
        }
    });

    it("keep the mathematics free of stray angle brackets", async () => {
        for (const page of await sources()) {
            const prose = page.source
                .replace(/^---\r?\n[\s\S]*?\r?\n---/, "")
                .replace(/```[\s\S]*?```/g, "")
                .replace(/`[^`\n]*`/g, "");

            for (const match of prose.matchAll(/\$([^$\n]+?)\$/g)) {
                const expression = match[1]!;
                expect(
                    /<\w/.test(expression),
                    `${page.file} has "${expression}", in which Markdown reads the sign as the start of a tag`,
                ).toBe(false);
            }
        }
    });
});
