/**
 * Tag one corpus task with one taxonomy technique.
 *
 *   pnpm exec tsx tools/coverage/tag.ts
 *   pnpm exec tsx tools/coverage/tag.ts <task-id> <technique-id> <evidence>
 *
 * With no arguments it lists the tasks that have no technique at all. The
 * evidence is an official editorial URL or the literal `derived` when the tag
 * comes from our own reading of the statement. The corpus is rewritten sorted
 * so that a tag is one line of diff.
 */
import { loadCorpus, loadTaxonomy, writeCorpus } from "./lib.ts";

const [taskId, techniqueId, ...evidenceParts] = process.argv.slice(2);
const taxonomy = await loadTaxonomy();
const { corpus, source } = await loadCorpus();

const untagged = corpus.tasks.filter((task) => task.techniques.length === 0);

if (!taskId) {
    if (untagged.length === 0) {
        console.log(`no untagged tasks (${corpus.tasks.length} total)`);
    } else {
        console.log(`${untagged.length} untagged of ${corpus.tasks.length}`);
        for (const task of untagged) console.log(`  ${task.id}  ${task.title}`);
    }
    process.exit(0);
}

if (!techniqueId) {
    console.error("usage: tag.ts <task-id> <technique-id> <evidence>");
    process.exit(1);
}

const task = corpus.tasks.find((entry) => entry.id === taskId);
if (!task) {
    console.error(`unknown task: ${taskId}`);
    process.exit(1);
}

const technique = taxonomy.techniques.find((entry) => entry.id === techniqueId);
if (!technique) {
    console.error(`unknown technique: ${techniqueId} (not in data/taxonomy.yaml)`);
    process.exit(1);
}

const evidence = evidenceParts.join(" ").trim();
if (!evidence) {
    console.error("evidence is required: an editorial URL, or `derived`");
    process.exit(1);
}

if (task.techniques.includes(technique.id)) {
    console.log(`${task.id} already names ${technique.id}`);
    process.exit(0);
}

task.techniques.push(technique.id);
await writeCorpus(corpus, source);
console.log(`tagged ${task.id} with ${technique.id}`);
console.log(`untagged: ${corpus.tasks.filter((entry) => entry.techniques.length === 0).length}`);
