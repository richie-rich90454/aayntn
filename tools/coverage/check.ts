/**
 * Structural checks for the coverage artifacts.
 *
 * The checks are about consistency, not completeness. A technique with status
 * `missing`, or a task with no technique, is an honest gap and does not fail
 * this command. A duplicate id, a tag that names nothing, or a summary that no
 * longer matches the data is a real error.
 */
import { isDeepStrictEqual } from "node:util";
import { subjectSchema } from "../lib/schema.ts";
import {
    computeSummary,
    loadCorpus,
    loadRegistered,
    loadSummary,
    loadTaxonomy,
    withoutUpdated,
} from "./lib.ts";

const errors: string[] = [];
const subjects = new Set<string>(subjectSchema.options);
const taxonomy = await loadTaxonomy();
const { corpus } = await loadCorpus();
const summary = await loadSummary();
const registered = await loadRegistered();

const techniqueIds = new Set<string>();
for (const technique of taxonomy.techniques) {
    if (techniqueIds.has(technique.id)) {
        errors.push(`duplicate technique id: ${technique.id}`);
    }
    techniqueIds.add(technique.id);
}

for (const technique of taxonomy.techniques) {
    if (!subjects.has(technique.subject)) {
        errors.push(`technique ${technique.id} names unknown subject: ${technique.subject}`);
    }
}

for (const task of corpus.tasks) {
    for (const id of task.techniques) {
        if (!techniqueIds.has(id)) {
            errors.push(`task ${task.id} names unknown technique: ${id}`);
        }
    }
}

const expected = computeSummary(taxonomy, corpus, registered);
if (!isDeepStrictEqual(withoutUpdated(summary), expected)) {
    errors.push("data/coverage-summary.json disagrees with a fresh computation");
}

if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
} else {
    const published = taxonomy.techniques.filter((entry) => entry.status === "published").length;
    const missing = taxonomy.techniques.filter((entry) => entry.status === "missing").length;
    const untagged = corpus.tasks.filter((task) => task.techniques.length === 0).length;
    console.log(
        `ok: ${taxonomy.techniques.length} techniques (${published} published, ${missing} missing), ${corpus.tasks.length} tasks (${corpus.tasks.length - untagged} tagged, ${untagged} untagged), ${expected.complete}/${expected.required} complete`,
    );
}
