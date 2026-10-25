/**
 * Every registered algorithm must reach the page a reader opens.
 *
 * The registry, the article, the subject table, and the manifest are four
 * separate files. These checks keep them from drifting apart: an algorithm
 * without an article, an article without the summary or the code viewer, a
 * subject page that forgets the algorithm, or a manifest that names a source
 * file that does not exist is a hole in the encyclopedia.
 */
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { ROOT } from "../../tools/lib/paths";

interface Algorithm {
    id: string;
    title: string;
    subject: string;
    manifest: string;
}

interface Manifest {
    algorithm: string;
    variants: { id: string; language: string; file: string }[];
}

interface GeneratedAlgorithm {
    id: string;
    href: string;
    variants: { id: string; language: string; file: string }[];
}

const registry = parseYaml(await readFile(join(ROOT, "data/algorithms/registry.yaml"), "utf8")) as {
    algorithms: Algorithm[];
};
const algorithms = registry.algorithms;
const generated = JSON.parse(
    await readFile(join(ROOT, "docs/.vitepress/data/generated/algorithms.json"), "utf8"),
) as GeneratedAlgorithm[];
const counts = JSON.parse(
    await readFile(join(ROOT, "docs/.vitepress/data/generated/algorithm-counts.json"), "utf8"),
) as Record<string, number>;

async function articles(): Promise<Map<string, string>> {
    const files = await fg("docs/algorithms/**/*.md", { cwd: ROOT, absolute: true });
    const result = new Map<string, string>();
    for (const file of files) {
        const source = await readFile(file, "utf8");
        const match = /^implementations:\s*(\S+)\s*$/m.exec(source);
        if (match) result.set(match[1]!, file);
    }
    return result;
}

describe("the algorithms", () => {
    it("registers every id once", () => {
        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const algorithm of algorithms) {
            if (seen.has(algorithm.id)) duplicates.push(algorithm.id);
            seen.add(algorithm.id);
        }
        expect(duplicates).toEqual([]);
    });

    it("gives every algorithm one article that embeds the summary and the code", async () => {
        const files = await articles();
        const problems: string[] = [];
        for (const algorithm of algorithms) {
            const file = files.get(algorithm.id);
            if (!file) {
                problems.push(`${algorithm.id} has no article`);
                continue;
            }
            const source = await readFile(file, "utf8");
            if (!source.includes(`<AlgorithmSummary :entry="algorithm" />`)) {
                problems.push(`${algorithm.id} has no summary in ${file}`);
            }
            if (!source.includes(`<CodeViewer :entry="algorithm" />`)) {
                problems.push(`${algorithm.id} has no code viewer in ${file}`);
            }
            if (!source.includes(`data/generated/algorithms/${algorithm.id}.json`)) {
                problems.push(`${algorithm.id} does not import its own data in ${file}`);
            }
        }
        expect(problems).toEqual([]);
    });

    it("lists every algorithm on its subject page with the article and the source", async () => {
        const pages = new Map<string, string>();
        const problems: string[] = [];
        for (const algorithm of algorithms) {
            const subject = algorithm.id.split(".")[0]!;
            if (!pages.has(subject)) {
                pages.set(
                    subject,
                    await readFile(join(ROOT, "docs/algorithms", subject, "index.md"), "utf8"),
                );
            }
            const name = algorithm.id.split(".").slice(1).join(".");
            const slug = algorithm.id.replace(/\./g, "-");
            const page = pages.get(subject)!;
            if (!page.includes(`](/algorithms/${subject}/${name})`)) {
                problems.push(`${algorithm.id} is absent from the ${subject} subject page`);
            }
            if (!page.includes(`](/implementations/${slug}/)`)) {
                problems.push(`${algorithm.id} has no source link on the ${subject} subject page`);
            }
        }
        expect(problems).toEqual([]);
    });

    it("declares only source files that exist", async () => {
        const problems: string[] = [];
        for (const algorithm of algorithms) {
            const manifest = parseYaml(
                await readFile(join(ROOT, algorithm.manifest), "utf8"),
            ) as Manifest;
            if (manifest.algorithm !== algorithm.id) {
                problems.push(`${algorithm.id} declares ${manifest.algorithm}`);
            }
            if (manifest.variants.length === 0) {
                problems.push(`${algorithm.id} has no variants`);
            }
            for (const variant of manifest.variants) {
                const file = join(ROOT, dirname(algorithm.manifest), variant.file);
                try {
                    await access(file);
                } catch {
                    problems.push(`${algorithm.id} names a missing source: ${variant.file}`);
                }
            }
        }
        expect(problems).toEqual([]);
    });

    it("matches the generated index exactly", async () => {
        expect(generated).toHaveLength(algorithms.length);
        const byId = new Map(generated.map((algorithm) => [algorithm.id, algorithm]));
        const problems: string[] = [];
        for (const algorithm of algorithms) {
            const entry = byId.get(algorithm.id);
            if (!entry) {
                problems.push(`${algorithm.id} is absent from the generated index`);
                continue;
            }
            if (entry.href !== `/algorithms/${algorithm.id.replace(/\./g, "/")}`) {
                problems.push(`${algorithm.id} has the route ${entry.href}`);
            }
            const manifest = parseYaml(
                await readFile(join(ROOT, algorithm.manifest), "utf8"),
            ) as Manifest;
            if (entry.variants.length !== manifest.variants.length) {
                problems.push(
                    `${algorithm.id} has ${entry.variants.length} generated variants and ${manifest.variants.length} in the manifest`,
                );
            }
            const own = JSON.parse(
                await readFile(
                    join(ROOT, "docs/.vitepress/data/generated/algorithms", `${algorithm.id}.json`),
                    "utf8",
                ),
            ) as GeneratedAlgorithm;
            if (own.id !== algorithm.id || own.variants.length !== entry.variants.length) {
                problems.push(`${algorithm.id} has an incomplete per-page document`);
            }
            if (counts[algorithm.id] !== entry.variants.length) {
                problems.push(`${algorithm.id} has the wrong count in the article header data`);
            }
        }
        expect(problems).toEqual([]);
    });
});
