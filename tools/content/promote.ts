/**
 * Promote finished topics into the shared registries.
 *
 * An author writes only inside the topic's own directory: the article, the
 * manifest and its sources, a fixture part, and the problem records. The
 * shared files — the fixture map, the algorithm registry and the taxonomy —
 * are written here, once, in a deterministic order, so two authors can never
 * conflict over them.
 *
 * Usage: `pnpm exec tsx tools/content/promote.ts <id> [<id> ...]`
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { ROOT } from "../lib/paths.ts";
import { execFileSync } from "node:child_process";

interface TaxonomyEntry {
    id: string;
    name: string;
    subject: string;
    status: string;
    [key: string]: unknown;
}

const ids = process.argv.slice(2).sort();
if (ids.length === 0) {
    process.stderr.write("usage: promote <technique.id> [...]\n");
    process.exit(2);
}

const casesPath = join(ROOT, "tests/fixtures/cases.yaml");
const registryPath = join(ROOT, "data/algorithms/registry.yaml");
const taxonomyPath = join(ROOT, "data/taxonomy.yaml");

let casesText = readFileSync(casesPath, "utf8");
let registryText = readFileSync(registryPath, "utf8");
const taxonomy = parseYaml(readFileSync(taxonomyPath, "utf8")) as {
    techniques: TaxonomyEntry[];
};

let promoted = 0;
let skipped = 0;

for (const id of ids) {
    const entry = taxonomy.techniques.find((row) => row.id === id);
    if (!entry) {
        process.stderr.write(`skip ${id}: it is not in the taxonomy\n`);
        skipped += 1;
        continue;
    }
    const subject = entry.subject;
    const slug = id.split(".").slice(1).join("-");
    const manifest = `implementations/${subject}/${slug}/algorithm.yaml`;
    const partsPath = join(ROOT, `tests/fixtures/parts/${id}.yaml`);

    if (!existsSync(join(ROOT, manifest))) {
        process.stderr.write(`skip ${id}: no manifest at ${manifest}\n`);
        skipped += 1;
        continue;
    }
    if (!existsSync(partsPath)) {
        process.stderr.write(`skip ${id}: no fixtures at tests/fixtures/parts/${id}.yaml\n`);
        skipped += 1;
        continue;
    }

    // Fixtures: append a block only when the identifier is not already mapped.
    if (!new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "m").test(casesText)) {
        const cases = parseYaml(readFileSync(partsPath, "utf8")) as unknown[];
        const block = stringifyYaml({ [id]: cases }).trimEnd();
        casesText = `${casesText.trimEnd()}\n\n${block}\n`;
    }

    // Registry: append the entry when the identifier is absent.
    if (
        !new RegExp(`id:\\s*${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(
            registryText,
        )
    ) {
        registryText = `${registryText.trimEnd()}\n    - id: ${id}\n      title: ${entry.name}\n      subject: ${subject}\n      manifest: ${manifest}\n`;
    }

    // Taxonomy: mark it published.
    if (entry.status !== "published") entry.status = "published";
    promoted += 1;
}

writeFileSync(casesPath, casesText, "utf8");
writeFileSync(registryPath, registryText, "utf8");
writeFileSync(taxonomyPath, stringifyYaml(taxonomy).trimEnd() + "\n", "utf8");

execFileSync(
    "pnpm",
    [
        "exec",
        "oxfmt",
        "--write",
        "tests/fixtures/cases.yaml",
        "data/algorithms/registry.yaml",
        "data/taxonomy.yaml",
    ],
    {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
    },
);

process.stdout.write(`promoted ${promoted}, skipped ${skipped}\n`);
