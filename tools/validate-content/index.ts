/**
 * Validate the content before the site is allowed to build.
 *
 * The checks are deliberately strict. A beautifully designed page that links
 * to a lesson that does not exist, or that claims a complexity the
 * implementation does not have, is worse than a missing page.
 *
 * Checks performed:
 *   1.  Every lesson frontmatter matches the schema.
 *   2.  Lesson identifiers are unique.
 *   3.  Every required prerequisite names a lesson that exists.
 *   4.  The prerequisite graph is acyclic.
 *   5.  Every internal Markdown link resolves to a page that exists.
 *   6.  Every declared code variant resolves to a real source file.
 *   7.  Every declared visualization is registered.
 *   8.  Every declared problem is registered.
 *   9.  Every mathematical expression compiles through KaTeX.
 *   10. A substantial algorithm article has the sections it promises.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import katex from "katex";
import { katexMacros } from "../../docs/.vitepress/theme/katex-macros";
import {
    DOCS_DIR,
    IMPLEMENTATIONS_DIR,
    ROOT,
    listMarkdownFiles,
    parseMarkdownFrontmatter,
    rel,
} from "../lib/paths.ts";
import {
    algorithmManifestSchema,
    curriculumTrackSchema,
    lessonFrontmatterSchema,
    problemSchema,
    visualizationSchema,
} from "../lib/schema.ts";

interface Problem {
    id: string;
    file: string;
}

interface Visualization {
    id: string;
    file: string;
}

interface AlgorithmManifestInfo {
    algorithm: string;
    directory: string;
    file: string;
    variants: { id: string; file: string; time?: string; auxiliarySpace?: string }[];
}

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string) {
    errors.push(message);
}

function warn(message: string) {
    warnings.push(message);
}

/* ------------------------------------------------------------------ */
/* Load everything                                                     */
/* ------------------------------------------------------------------ */

async function loadLessons() {
    const files = await listMarkdownFiles(DOCS_DIR);
    const lessons: {
        id: string;
        title: string;
        file: string;
        href: string;
        body: string;
        data: Record<string, unknown>;
    }[] = [];

    for (const file of files) {
        const relativePath = rel(ROOT, file);
        if (relativePath.startsWith("docs/implementations/")) continue;

        const source = await readFile(file, "utf8");
        const parsed = parseMarkdownFrontmatter(source);
        if (!parsed) continue;

        const result = lessonFrontmatterSchema.safeParse(parsed.data);
        if (!result.success) {
            fail(
                `${relativePath}: invalid frontmatter — ${result.error.issues[0]?.message ?? "unknown error"}`,
            );
            continue;
        }

        const withoutExtension = relativePath.replace(/^docs\//, "").replace(/\.md$/, "");
        const href = withoutExtension.endsWith("/index")
            ? "/" + withoutExtension.slice(0, -"/index".length)
            : "/" + withoutExtension;

        lessons.push({
            id: result.data.id,
            title: result.data.title,
            file: relativePath,
            href,
            body: parsed.body,
            data: parsed.data,
        });
    }

    return lessons;
}

async function loadManifests(): Promise<AlgorithmManifestInfo[]> {
    const files = await fg("**/algorithm.yaml", {
        cwd: IMPLEMENTATIONS_DIR,
        absolute: true,
        onlyFiles: true,
    });
    const manifests: AlgorithmManifestInfo[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const result = algorithmManifestSchema.safeParse(raw);
        if (!result.success) {
            fail(
                `${rel(ROOT, file)}: invalid manifest — ${result.error.issues[0]?.message ?? "unknown error"}`,
            );
            continue;
        }
        manifests.push({
            algorithm: result.data.algorithm,
            directory: file.slice(0, -"/algorithm.yaml".length),
            file: rel(ROOT, file),
            variants: result.data.variants.map((variant) => ({
                id: variant.id,
                file: variant.file,
                time: variant.time,
                auxiliarySpace: variant.auxiliarySpace,
            })),
        });
    }
    return manifests;
}

async function loadProblems(): Promise<Problem[]> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "problems"),
        absolute: true,
        onlyFiles: true,
    });
    const problems: Problem[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const result = problemSchema.safeParse(raw);
        if (!result.success) {
            fail(
                `${rel(ROOT, file)}: invalid problem record — ${result.error.issues[0]?.message ?? "unknown error"}`,
            );
            continue;
        }
        problems.push({ id: result.data.id, file: rel(ROOT, file) });
    }
    return problems;
}

async function loadVisualizations(): Promise<Visualization[]> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "visualizations"),
        absolute: true,
        onlyFiles: true,
    });
    const visualizations: Visualization[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const result = visualizationSchema.safeParse(raw);
        if (!result.success) {
            fail(
                `${rel(ROOT, file)}: invalid visualization record — ${result.error.issues[0]?.message ?? "unknown error"}`,
            );
            continue;
        }
        visualizations.push({ id: result.data.id, file: rel(ROOT, file) });
    }
    return visualizations;
}

async function loadCurriculum() {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "curriculum"),
        absolute: true,
        onlyFiles: true,
    });
    const tracks: { id: string; file: string; lessons: string[] }[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const result = curriculumTrackSchema.safeParse(raw);
        if (!result.success) {
            fail(
                `${rel(ROOT, file)}: invalid curriculum track — ${result.error.issues[0]?.message ?? "unknown error"}`,
            );
            continue;
        }
        tracks.push({ id: result.data.id, file: rel(ROOT, file), lessons: result.data.lessons });
    }
    return tracks;
}

/* ------------------------------------------------------------------ */
/* Checks                                                              */
/* ------------------------------------------------------------------ */

function checkUniqueIds(lessons: Awaited<ReturnType<typeof loadLessons>>) {
    const seen = new Map<string, string>();
    for (const lesson of lessons) {
        const previous = seen.get(lesson.id);
        if (previous) {
            fail(`duplicate lesson id "${lesson.id}" in ${lesson.file} and ${previous}`);
        } else {
            seen.set(lesson.id, lesson.file);
        }
    }
    return seen;
}

function checkPrerequisites(
    lessons: Awaited<ReturnType<typeof loadLessons>>,
    known: Map<string, string>,
) {
    const edges: { from: string; to: string }[] = [];

    for (const lesson of lessons) {
        const prerequisites = (lesson.data.prerequisites ?? {}) as {
            required?: string[];
            recommended?: string[];
        };
        for (const target of prerequisites.required ?? []) {
            if (!known.has(target)) {
                fail(
                    `${lesson.file}: required prerequisite "${target}" does not name a known lesson`,
                );
                continue;
            }
            edges.push({ from: target, to: lesson.id });
        }
        for (const target of prerequisites.recommended ?? []) {
            if (!known.has(target)) {
                fail(
                    `${lesson.file}: recommended prerequisite "${target}" does not name a known lesson`,
                );
            }
        }
    }

    // Kahn's algorithm over the required edges: any lesson left over sits on a
    // cycle.
    const indegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();
    for (const lesson of lessons) indegree.set(lesson.id, 0);
    for (const edge of edges) {
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
        dependents.set(edge.from, [...(dependents.get(edge.from) ?? []), edge.to]);
    }
    const queue = [...indegree.entries()].filter(([, value]) => value === 0).map(([key]) => key);
    let visited = 0;
    while (queue.length) {
        const current = queue.shift()!;
        visited += 1;
        for (const next of dependents.get(current) ?? []) {
            const remaining = (indegree.get(next) ?? 0) - 1;
            indegree.set(next, remaining);
            if (remaining === 0) queue.push(next);
        }
    }
    if (visited !== lessons.length) {
        const onCycle = [...indegree.entries()]
            .filter(([, value]) => value > 0)
            .map(([key]) => key);
        fail(`the prerequisite graph has a cycle involving: ${onCycle.join(", ")}`);
    }
}

async function checkLinks(lessons: Awaited<ReturnType<typeof loadLessons>>) {
    const pages = new Set<string>();
    for (const file of await listMarkdownFiles(DOCS_DIR)) {
        const relativePath = rel(ROOT, file).replace(/^docs\//, "");
        const withoutExtension = relativePath.replace(/\.md$/, "");
        // A page is addressable both with and without its trailing slash.
        const canonical = withoutExtension.endsWith("/index")
            ? withoutExtension.slice(0, -"/index".length)
            : withoutExtension;
        pages.add("/" + canonical);
        pages.add("/" + canonical + "/");
        pages.add("/" + withoutExtension);
    }

    /** Resolve a site-absolute path, ignoring the trailing slash. */
    const resolves = (href: string): boolean => {
        const target = href.split("#")[0]!;
        if (!target) return true;
        if (pages.has(target)) return true;
        if (pages.has(target.replace(/\/$/, ""))) return true;
        if (existsSync(join(DOCS_DIR, "public", target))) return true;
        if (existsSync(join(DOCS_DIR, "public", target.replace(/\/$/, "")))) return true;
        return false;
    };

    const linkPattern = /\]\(([^)\s]+)\)/g;
    for (const lesson of lessons) {
        let match: RegExpExecArray | null;
        while ((match = linkPattern.exec(lesson.body)) !== null) {
            const href = match[1]!;
            if (/^(https?:|mailto:|#|\/)/.test(href)) {
                if (href.startsWith("/") && !href.includes("#")) {
                    if (!resolves(href)) {
                        fail(`${lesson.file}: internal link "${href}" does not resolve to a page`);
                    }
                }
                continue;
            }
            if (
                href.endsWith(".md") ||
                href.endsWith(".yaml") ||
                href.endsWith(".c") ||
                href.endsWith(".cpp")
            ) {
                const target = join(DOCS_DIR, href);
                if (!existsSync(target)) {
                    fail(`${lesson.file}: relative link "${href}" does not resolve to a file`);
                }
            }
        }
    }
}

function checkImplementations(manifests: AlgorithmManifestInfo[], known: Map<string, string>) {
    for (const manifest of manifests) {
        for (const variant of manifest.variants) {
            const target = join(manifest.directory, variant.file);
            if (!existsSync(target)) {
                fail(
                    `${manifest.file}: variant "${variant.id}" points at ${variant.file}, which does not exist`,
                );
            }
            if (!variant.time || !variant.auxiliarySpace) {
                fail(`${manifest.file}: variant "${variant.id}" is missing a complexity statement`);
            }
        }
    }

    // A lesson that claims an implementation must name a registered algorithm.
    for (const [id, file] of known) {
        const lesson = lessonsById.get(id);
        const claimed = (lesson?.data.implementations ?? null) as string | null;
        if (claimed && !manifests.some((manifest) => manifest.algorithm === claimed)) {
            fail(
                `${file}: declares implementations "${claimed}", which has no registered manifest`,
            );
        }
    }
}

function checkVisualizations(
    lessons: Awaited<ReturnType<typeof loadLessons>>,
    visualizations: Visualization[],
) {
    const known = new Set(visualizations.map((entry) => entry.id));
    for (const lesson of lessons) {
        const claimed = (lesson.data.visualization ?? null) as string | null;
        if (claimed && !known.has(claimed)) {
            fail(`${lesson.file}: declares visualization "${claimed}", which is not registered`);
        }
    }
}

function checkProblems(lessons: Awaited<ReturnType<typeof loadLessons>>, problems: Problem[]) {
    const known = new Set(problems.map((entry) => entry.id));
    for (const lesson of lessons) {
        const claimed = (lesson.data.problems ?? []) as string[];
        for (const id of claimed) {
            if (!known.has(id)) {
                fail(`${lesson.file}: references problem "${id}", which is not in the catalogue`);
            }
        }
    }
}

function checkCurriculum(
    tracks: Awaited<ReturnType<typeof loadCurriculum>>,
    known: Map<string, string>,
) {
    for (const track of tracks) {
        for (const lesson of track.lessons) {
            if (!known.has(lesson)) {
                fail(
                    `${track.file}: curriculum track references lesson "${lesson}", which does not exist`,
                );
            }
        }
    }
}

/**
 * Every dollar-delimited expression must compile. A formula that KaTeX
 * cannot parse is a broken page, and the failure is invisible to the author.
 */
function checkMathematics(lessons: Awaited<ReturnType<typeof loadLessons>>) {
    const displayPattern = /\$\$([\s\S]+?)\$\$/g;
    const inlinePattern = /(?<![\\$])\$([^$\n]+?)\$(?!\$)/g;

    for (const lesson of lessons) {
        // Only the prose is checked. A fenced block is an example and an inline
        // code span is a literal, so the dollar signs inside them are text
        // rather than mathematics, which is exactly how markdown-it treats them.
        const prose = lesson.body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

        const withoutBlocks = prose.replace(displayPattern, "");
        for (const match of prose.matchAll(displayPattern)) {
            try {
                katex.renderToString(match[1]!.trim(), {
                    throwOnError: true,
                    strict: false,
                    macros: katexMacros,
                });
            } catch (error) {
                fail(
                    `${lesson.file}: KaTeX cannot render "$$${match[1]}$$" — ${(error as Error).message}`,
                );
            }
        }
        for (const match of withoutBlocks.matchAll(inlinePattern)) {
            try {
                katex.renderToString(match[1]!.trim(), {
                    throwOnError: true,
                    strict: false,
                    macros: katexMacros,
                });
            } catch (error) {
                fail(
                    `${lesson.file}: KaTeX cannot render "$${match[1]}$" — ${(error as Error).message}`,
                );
            }
        }
    }
}

/**
 * A substantial algorithm article must carry the sections it promises.
 * A missing "Why this fails" section is a missing teaching moment.
 */
const REQUIRED_SECTIONS = [
    "At a glance",
    "Problem motivation",
    "Recognition patterns",
    "Naive approach",
    "Key insight",
    "Formal model",
    "Algorithm derivation",
    "Correctness proof",
    "Complexity analysis",
    "Algorithm selection",
    "Reference implementations",
    "Recursion decision",
    "Common mistakes",
    "Contest strategy",
    "Practice progression",
    "Review checklist",
];

function checkArticleSections(lessons: Awaited<ReturnType<typeof loadLessons>>) {
    for (const lesson of lessons) {
        const claimsImplementation = Boolean(lesson.data.implementations);
        if (!claimsImplementation) continue;

        const headings = [...lesson.body.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) =>
            match[1]!.trim().toLowerCase(),
        );
        for (const required of REQUIRED_SECTIONS) {
            const needle = required.toLowerCase();
            const found = headings.some(
                (heading) =>
                    heading === needle || heading.startsWith(needle) || needle.startsWith(heading),
            );
            if (!found) {
                fail(`${lesson.file}: an algorithm article must contain a "${required}" section`);
            }
        }
    }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

let lessonsById = new Map<string, Awaited<ReturnType<typeof loadLessons>>[number]>();

async function main() {
    const [lessons, manifests, problems, visualizations, tracks] = await Promise.all([
        loadLessons(),
        loadManifests(),
        loadProblems(),
        loadVisualizations(),
        loadCurriculum(),
    ]);

    lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    const known = checkUniqueIds(lessons);
    checkPrerequisites(lessons, known);
    checkImplementations(manifests, known);
    checkVisualizations(lessons, visualizations);
    checkProblems(lessons, problems);
    checkCurriculum(tracks, known);
    await checkLinks(lessons);
    checkMathematics(lessons);
    checkArticleSections(lessons);

    for (const message of warnings) process.stdout.write(`warning: ${message}\n`);

    if (errors.length > 0) {
        for (const message of errors) process.stderr.write(`error: ${message}\n`);
        process.stderr.write(`\n${errors.length} content problem(s) found.\n`);
        process.exit(1);
    }

    process.stdout.write(
        `content is valid: ${lessons.length} lessons, ${manifests.length} algorithms, ` +
            `${problems.length} problems, ${visualizations.length} visualizations\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
