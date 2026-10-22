/**
 * The Markdown block structure.
 *
 * A blank line is what ends a block in Markdown, so a page whose blocks run
 * into each other is read by the page compiler as one enormous element. The
 * failure is reported against a character offset that points at the wrong
 * place, so the structure is checked here instead.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { DOCS_DIR, ROOT } from "../../tools/lib/paths";

/** The block-level elements the theme provides. */
const COMPONENTS = [
    "AlgorithmSummary",
    "AlgorithmPlayer",
    "Banner",
    "CodeViewer",
    "ContestSimulation",
    "Figure",
    "LearnNext",
    "MathPanel",
    "Ornament",
    "PracticeCatalog",
    "PrerequisiteGraph",
    "ProgressDashboard",
    "Synonyms",
];

const COMPONENT_PATTERN = new RegExp(`<\\/?(?:${COMPONENTS.join("|")})\\b[^>]*>`, "g");

async function pages(): Promise<{ file: string; body: string }[]> {
    const files = await fg("**/*.md", {
        cwd: DOCS_DIR,
        absolute: true,
        onlyFiles: true,
        ignore: ["implementations/**", ".vitepress/**"],
    });
    const result: { file: string; body: string }[] = [];
    for (const file of files) {
        const source = await readFile(file, "utf8");
        const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
        result.push({
            file: file.replace(/\\/g, "/").replace(`${ROOT.replace(/\\/g, "/")}/`, ""),
            body,
        });
    }
    return result;
}

describe("the block structure", () => {
    it("gives every heading a blank line before it", async () => {
        for (const page of await pages()) {
            const lines = page.body.replace(/```[\s\S]*?```/g, "").split("\n");
            for (let index = 1; index < lines.length; index += 1) {
                const line = lines[index] ?? "";
                const previous = lines[index - 1] ?? "";
                if (!/^#{1,6}\s/.test(line)) continue;
                if (previous.trim() === "") continue;
                if (/^#{1,6}\s/.test(previous)) continue;
                // A heading may follow a component's closing tag only when the
                // component is closed and the line before it is blank.
                expect(
                    previous.trim(),
                    `${page.file} has a heading with no blank line before it: "${line.trim()}"`,
                ).toBe("");
            }
        }
    });

    it("closes every component that it opens", async () => {
        for (const page of await pages()) {
            const stack: string[] = [];
            // A component name in a code span is a mention, not a tag.
            const prose = page.body.replace(/`[^`\n]*`/g, "");
            for (const match of prose.matchAll(COMPONENT_PATTERN)) {
                const tag = match[0];
                const name = /^<\/?([A-Za-z]+)/.exec(tag)?.[1];
                if (!name) continue;
                if (tag.startsWith("</")) {
                    const open = stack.pop();
                    expect(open, `${page.file} closes a ${name} that was never opened`).toBe(name);
                } else if (!tag.endsWith("/>")) {
                    stack.push(name);
                }
            }
            expect(stack, `${page.file} leaves a component open: ${stack.join(", ")}`).toHaveLength(
                0,
            );
        }
    });

    it("keeps a blank line after the closing tag of a component", async () => {
        for (const page of await pages()) {
            const lines = page.body.replace(/```[\s\S]*?```/g, "").split("\n");
            for (let index = 0; index < lines.length - 1; index += 1) {
                const line = lines[index] ?? "";
                if (!/^<\/(MathPanel|Figure)>/.test(line)) continue;
                const next = lines[index + 1] ?? "";
                expect(
                    next.trim(),
                    `${page.file} has no blank line after a closing component tag`,
                ).toBe("");
            }
        }
    });
});
