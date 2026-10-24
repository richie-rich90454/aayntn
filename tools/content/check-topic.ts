/**
 * Check one technique against the publishing contract.
 *
 * A topic is complete when its article has the full section contract, its
 * manifest names one source file per language, the shared fixture file exists
 * with at least three cases, and at least three curated problems name the
 * technique. The checker is what lets a topic be written without a reviewer
 * reading every line: the shape is machine-checked, and the build compiles and
 * runs the code.
 *
 * Usage: `pnpm exec tsx tools/content/check-topic.ts <technique.id>`
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { ROOT } from "../lib/paths.ts";

const SECTIONS = [
    "At a glance",
    "Problem motivation",
    "Recognition patterns",
    "Naive approach",
    "Key insight",
    "Visual intuition",
    "Formal model",
    "Algorithm derivation",
    "Step-by-step execution",
    "Correctness proof",
    "Complexity analysis",
    "Algorithm selection",
    "Reference implementations",
    "Recursion decision",
    "Implementation walkthrough",
    "Common mistakes",
    "Variants and extensions",
    "Contest strategy",
    "Worked problems",
    "Practice progression",
    "Review checklist",
    "Further reading",
];

const LANGUAGES = ["c", "cpp17", "java", "python", "pascal", "javascript"];

const id = process.argv[2];
if (!id) {
    process.stderr.write("usage: check-topic <technique.id>\n");
    process.exit(2);
}

const problems: string[] = [];
const note = (message: string) => problems.push(message);

const subject = id.split(".")[0]!;
const slug = id.split(".").slice(1).join("-");

/* The article ------------------------------------------------------------ */
const pages = await fg("docs/**/*.md", { cwd: ROOT, absolute: true, onlyFiles: true });
let article: string | null = null;
let body = "";
for (const page of pages) {
    if (page.includes("docs/implementations/")) continue;
    const source = readFileSync(page, "utf8");
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
    if (!match) continue;
    const data = parseYaml(match[1]!) as Record<string, unknown>;
    if (data["id"] === id) {
        article = page.slice(ROOT.length + 1).replace(/\\/g, "/");
        body = match[2]!;
        if (data["implementations"] !== id) {
            note(`the frontmatter must carry "implementations: ${id}"`);
        }
        break;
    }
}
if (!article) {
    note(`no article carries the frontmatter id ${id}`);
} else {
    for (const section of SECTIONS) {
        if (
            !new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(
                body,
            )
        ) {
            note(`the article is missing the section "${section}"`);
        }
    }
}

/* The manifest and its sources ------------------------------------------- */
const directory = join("implementations", subject, slug);
const manifestPath = join(directory, "algorithm.yaml");
if (!existsSync(join(ROOT, manifestPath))) {
    note(`no manifest at ${manifestPath}`);
} else {
    const manifest = parseYaml(readFileSync(join(ROOT, manifestPath), "utf8")) as {
        algorithm?: string;
        variants?: { language?: string; file?: string; kind?: string }[];
    };
    if (manifest.algorithm !== id) note(`the manifest names ${manifest.algorithm ?? "nothing"}`);
    const languages = new Set((manifest.variants ?? []).map((variant) => variant.language));
    for (const language of LANGUAGES) {
        if (!languages.has(language)) note(`no ${language} variant`);
    }
    for (const variant of manifest.variants ?? []) {
        if (!variant.file) continue;
        if (!existsSync(join(ROOT, directory, variant.file))) {
            note(`the ${variant.language} variant names a missing file ${variant.file}`);
        }
    }
}

/* The fixtures ----------------------------------------------------------- */
const fixturesPath = join("tests/fixtures/parts", `${id}.yaml`);
if (!existsSync(join(ROOT, fixturesPath))) {
    note(`no fixtures at ${fixturesPath}`);
} else {
    const fixtures = parseYaml(readFileSync(join(ROOT, fixturesPath), "utf8")) as unknown;
    const cases = Array.isArray(fixtures) ? fixtures : [];
    if (cases.length < 3) note(`the fixture file has ${cases.length} case(s); three are required`);
}

/* The problems ----------------------------------------------------------- */
const problemFiles = await fg("data/problems/*.yaml", {
    cwd: ROOT,
    absolute: true,
    onlyFiles: true,
});
let curated = 0;
for (const file of problemFiles) {
    const record = parseYaml(readFileSync(file, "utf8")) as { techniques?: unknown };
    if (Array.isArray(record.techniques) && record.techniques.includes(id)) curated += 1;
}
if (curated < 3) note(`${curated} curated problem(s) name the technique; three are required`);

if (problems.length > 0) {
    process.stdout.write(`FAIL ${id}\n`);
    for (const problem of problems) process.stdout.write(`  - ${problem}\n`);
    process.exit(1);
}

process.stdout.write(`PASS ${id}\n`);
