import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { DATA_DIR, ROOT } from "../lib/paths.ts";

export const DIVISIONS = [
    { id: "bronze", label: "Bronze" },
    { id: "silver", label: "Silver" },
    { id: "gold", label: "Gold" },
    { id: "platinum", label: "Platinum" },
] as const;

export type Division = (typeof DIVISIONS)[number]["id"];

export type TechniqueStatus = "published" | "missing" | "beyond";

export interface Technique {
    id: string;
    name: string;
    subject: string;
    synonyms: string[];
    status: TechniqueStatus;
    divisions: Division[];
}

export interface Taxonomy {
    techniques: Technique[];
}

export interface Task {
    id: string;
    title: string;
    source: string;
    division: Division;
    url: string | null;
    techniques: string[];
    evidence: string;
}

export interface Corpus {
    tasks: Task[];
}

export interface CoverageDivision {
    id: Division;
    label: string;
    required: number;
    complete: number;
    taggedTasks: number;
    totalTasks: number;
}

export interface CoverageSummary {
    updated: string | null;
    required: number;
    complete: number;
    taggedTasks: number;
    totalTasks: number;
    divisions: CoverageDivision[];
}

export const TAXONOMY_PATH = join(DATA_DIR, "taxonomy.yaml");
export const CORPUS_PATH = join(DATA_DIR, "corpus", "tasks.yaml");
export const SUMMARY_PATH = join(DATA_DIR, "coverage-summary.json");
export const REGISTRY_PATH = join(DATA_DIR, "algorithms", "registry.yaml");

export async function loadTaxonomy(): Promise<Taxonomy> {
    const doc = parseYaml(await readFile(TAXONOMY_PATH, "utf8")) as Taxonomy | null;
    if (!doc?.techniques) throw new Error(`${TAXONOMY_PATH} has no techniques list`);
    return doc;
}

export async function loadCorpus(): Promise<{ corpus: Corpus; source: string }> {
    const source = await readFile(CORPUS_PATH, "utf8");
    const doc = parseYaml(source) as Corpus | null;
    if (!doc?.tasks) throw new Error(`${CORPUS_PATH} has no tasks list`);
    return { corpus: doc, source };
}

export async function loadSummary(): Promise<CoverageSummary> {
    return JSON.parse(await readFile(SUMMARY_PATH, "utf8")) as CoverageSummary;
}

/** The techniques that the algorithm registry lists a manifest for. */
export async function loadRegistered(): Promise<Set<string>> {
    const doc = parseYaml(await readFile(REGISTRY_PATH, "utf8")) as {
        algorithms?: { id: string; manifest?: string }[];
    } | null;
    const ids = new Set<string>();
    for (const entry of doc?.algorithms ?? []) {
        if (!entry.manifest) continue;
        try {
            await access(join(ROOT, entry.manifest));
            ids.add(entry.id);
        } catch {
            // A registry entry whose manifest is gone is not a complete technique.
        }
    }
    return ids;
}

/**
 * Write the corpus back in the canonical form: tasks by id, techniques sorted,
 * and the header comment of the file kept. A tag therefore produces one line of
 * diff rather than a reordering of the whole file.
 */
export async function writeCorpus(corpus: Corpus, source: string): Promise<void> {
    const header = /^[\s\S]*?(?=^tasks:)/m.exec(source)?.[0] ?? "";
    const tasks = corpus.tasks
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((task) => ({ ...task, techniques: task.techniques.slice().sort() }));
    await writeFile(
        CORPUS_PATH,
        header + stringifyYaml({ tasks }, { indent: 4, lineWidth: 0 }),
        "utf8",
    );
}

/**
 * Turn the taxonomy and the corpus into the figures the site reads.
 *
 * `required` is every published or missing technique that the corpus actually
 * names. `complete` is the published techniques among them whose manifest is
 * registered in data/algorithms. A division is scoped to its own tasks, so a
 * technique counts once in each division whose corpus uses it.
 */
export function computeSummary(
    taxonomy: Taxonomy,
    corpus: Corpus,
    registered: ReadonlySet<string>,
): CoverageSummary {
    const known = new Set(taxonomy.techniques.map((technique) => technique.id));
    const used = new Set(
        corpus.tasks.flatMap((task) => task.techniques.filter((id) => known.has(id))),
    );
    const required = taxonomy.techniques.filter(
        (technique) =>
            (technique.status === "published" || technique.status === "missing") &&
            used.has(technique.id),
    );
    const complete = required.filter(
        (technique) => technique.status === "published" && registered.has(technique.id),
    );

    return {
        updated: null,
        required: required.length,
        complete: complete.length,
        taggedTasks: countTagged(corpus.tasks),
        totalTasks: corpus.tasks.length,
        divisions: DIVISIONS.map(({ id, label }) => {
            const tasks = corpus.tasks.filter((task) => task.division === id);
            const divisionUsed = new Set(tasks.flatMap((task) => task.techniques));
            return {
                id,
                label,
                required: required.filter((technique) => divisionUsed.has(technique.id)).length,
                complete: complete.filter((technique) => divisionUsed.has(technique.id)).length,
                taggedTasks: countTagged(tasks),
                totalTasks: tasks.length,
            };
        }),
    };
}

export function withoutUpdated(summary: CoverageSummary): CoverageSummary {
    return { ...summary, updated: null };
}

function countTagged(tasks: Task[]): number {
    return tasks.filter((task) => task.techniques.length > 0).length;
}
