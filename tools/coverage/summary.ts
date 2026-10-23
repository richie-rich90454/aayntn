/**
 * Recompute data/coverage-summary.json from the taxonomy and the corpus.
 *
 * The summary is the only coverage artifact the site reads. It is rewritten in
 * full on every run so that the numbers on the home page, the progress page and
 * the coverage page cannot drift apart.
 */
import { writeFile } from "node:fs/promises";
import { computeSummary, loadCorpus, loadRegistered, loadTaxonomy, SUMMARY_PATH } from "./lib.ts";

const taxonomy = await loadTaxonomy();
const { corpus } = await loadCorpus();
const registered = await loadRegistered();
const summary = computeSummary(taxonomy, corpus, registered);
summary.updated = new Date().toISOString().slice(0, 10);

await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 4)}\n`, "utf8");

console.log(
    `required ${summary.required}, complete ${summary.complete}, tagged ${summary.taggedTasks}/${summary.totalTasks}`,
);
for (const division of summary.divisions) {
    console.log(
        `  ${division.label}: ${division.complete}/${division.required} complete, ${division.taggedTasks}/${division.totalTasks} tagged`,
    );
}
