/**
 * The coverage data must be internally consistent.
 *
 * These are the invariants the site's claim depends on: an id is defined once,
 * a tag points at something real, every article is in the taxonomy, the summary
 * is derived rather than edited, and a division is one of the four tracks.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { DOCS_DIR, parseMarkdownFrontmatter } from "../../tools/lib/paths";
import {
    DIVISIONS,
    computeSummary,
    loadCorpus,
    loadRegistered,
    loadSummary,
    loadTaxonomy,
    withoutUpdated,
} from "../../tools/coverage/lib";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIVISION_IDS = DIVISIONS.map((division) => division.id);

const taxonomy = await loadTaxonomy();
const { corpus } = await loadCorpus();
const summary = await loadSummary();
const registered = await loadRegistered();

async function articleIds(): Promise<string[]> {
    const files = await fg("algorithms/*/*.md", {
        cwd: DOCS_DIR,
        absolute: true,
        onlyFiles: true,
    });
    const ids: string[] = [];
    for (const file of files) {
        if (file.endsWith("index.md")) continue;
        const parsed = parseMarkdownFrontmatter(await readFile(file, "utf8"));
        expect(parsed, `${file} has no frontmatter`).not.toBeNull();
        ids.push((parsed?.data["id"] as string) ?? "");
    }
    return ids;
}

describe("the taxonomy", () => {
    it("defines every technique id once", () => {
        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const technique of taxonomy.techniques) {
            if (seen.has(technique.id)) duplicates.push(technique.id);
            seen.add(technique.id);
        }
        expect(duplicates, `duplicate technique ids: ${duplicates.join(", ")}`).toEqual([]);
    });

    it("kebab-cases every id segment", () => {
        const invalid = taxonomy.techniques
            .map((technique) => technique.id)
            .filter((id) => !id.split(".").every((segment) => KEBAB.test(segment)));
        expect(invalid, `ids that are not kebab-cased: ${invalid.join(", ")}`).toEqual([]);
    });

    it("contains every published article", async () => {
        const known = new Set(taxonomy.techniques.map((technique) => technique.id));
        const missing = (await articleIds()).filter((id) => !known.has(id));
        expect(missing, `articles absent from the taxonomy: ${missing.join(", ")}`).toEqual([]);
    });
});

describe("the corpus", () => {
    it("only names techniques that exist", () => {
        const known = new Set(taxonomy.techniques.map((technique) => technique.id));
        const unknown: string[] = [];
        for (const task of corpus.tasks) {
            for (const id of task.techniques) {
                if (!known.has(id)) unknown.push(`${task.id} -> ${id}`);
            }
        }
        expect(unknown, `tasks naming unknown techniques: ${unknown.join(", ")}`).toEqual([]);
    });
});

describe("the summary", () => {
    it("equals a fresh computation", () => {
        expect(withoutUpdated(summary)).toEqual(computeSummary(taxonomy, corpus, registered));
    });

    it("uses only the four divisions", () => {
        const unknown = summary.divisions
            .map((division) => division.id)
            .filter((id) => !DIVISION_IDS.includes(id));
        expect(unknown, `unknown summary divisions: ${unknown.join(", ")}`).toEqual([]);
        const taskUnknown = corpus.tasks
            .map((task) => task.division)
            .filter((id) => !DIVISION_IDS.includes(id));
        expect(taskUnknown, `unknown task divisions: ${taskUnknown.join(", ")}`).toEqual([]);
    });
});
