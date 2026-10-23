/**
 * Generate every derived artifact in the site.
 *
 * Sources of truth:
 *   docs (recursive)               editorial content and lesson frontmatter
 *   implementations (recursive)    implementation manifests
 *   data/problems (one dir)       problem catalog
 *   data/visualizations (one dir) laboratory registry
 *   data/curriculum (one dir)     division tracks
 *   data/synonyms (one dir)       search synonym expansion
 *   templates (recursive)         reusable contest templates
 *
 * Outputs:
 *   docs/.vitepress/data/generated (json)  index documents consumed by the theme
 *   docs/.vitepress/data/generated/src     Shiki-highlighted source fragments
 *   docs/public/implementations            raw source downloads
 *   docs/public/search-index.json          client-side search index
 *   docs/implementations (one dir)         stable per-algorithm source pages
 *
 * The output is deterministic: running the generator twice produces identical
 * files.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { createHighlighter } from "shiki";
import {
    DOCS_DIR,
    GENERATED_DIR,
    IMPLEMENTATIONS_DIR,
    PUBLIC_DIR,
    ROOT,
    TEMPLATES_DIR,
    parseMarkdownFrontmatter,
} from "../lib/paths.ts";
import {
    algorithmManifestSchema,
    curriculumTrackSchema,
    lessonFrontmatterSchema,
    problemSchema,
    synonymsSchema,
    visualizationSchema,
    type AlgorithmManifest,
} from "../lib/schema.ts";
import { aayntnDark, aayntnLight } from "../../docs/.vitepress/theme/shiki-theme.ts";
import type {
    AlgorithmEntry,
    CurriculumTrack,
    Division,
    Importance,
    LanguageId,
    LessonEntry,
    PrerequisiteGraph,
    ProblemEntry,
    SearchEntry,
    Subject,
    VisualizationEntry,
} from "../../docs/.vitepress/data/types.ts";

const SUBJECT_LABELS: Record<string, string> = {
    foundations: "Foundations and complexity",
    enumeration: "Enumeration and searching",
    searching: "Searching",
    greedy: "Greedy methods",
    arrays: "Arrays and sequences",
    "range-queries": "Range query structures",
    graphs: "Graphs and shortest paths",
    trees: "Trees and decompositions",
    "dynamic-programming": "Dynamic programming",
    strings: "Strings",
    "number-theory": "Number theory",
    combinatorics: "Combinatorics",
    geometry: "Computational geometry",
    advanced: "Advanced algorithms and special techniques",
};

const SUBJECTS = Object.keys(SUBJECT_LABELS) as Subject[];

const SHIKI_LANG: Record<string, string> = {
    c: "c",
    cpp17: "cpp",
    java: "java",
    python: "python",
    pascal: "pascal",
    javascript: "javascript",
};

const LANGUAGE_LABEL: Record<string, string> = {
    c: "C",
    cpp17: "C++17",
    java: "Java",
    python: "Python",
    pascal: "Pascal",
    javascript: "JavaScript",
};

const FILE_EXTENSION: Record<string, string> = {
    c: "c",
    cpp17: "cpp",
    java: "java",
    python: "py",
    pascal: "pas",
    javascript: "js",
};

const ALL_LANGUAGES: LanguageId[] = ["c", "cpp17", "java", "python", "pascal", "javascript"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function stripMarkdown(source: string): string {
    return source
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^>\s?/gm, "")
        .replace(/[*_~]/g, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function toRoute(relativePath: string): string {
    const withoutExtension = relativePath.replace(/\.md$/, "");
    const withIndex = withoutExtension.endsWith("/index")
        ? withoutExtension.slice(0, -"/index".length)
        : withoutExtension;
    return withIndex === "" ? "/" : `/${withIndex}`;
}

function collectKeywords(data: Record<string, unknown>): string[] {
    const raw = data["keywords"];
    if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
    return [];
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

interface LoadedLesson {
    id: string;
    title: string;
    summary: string;
    href: string;
    divisions: Division[];
    subjects: Subject[];
    importance: Importance;
    level: "introductory" | "intermediate" | "advanced";
    prerequisites: { required: string[]; recommended: string[] };
    complexity?: { time: string; space: string };
    assumptions: string[];
    implementations?: string;
    visualization?: string;
    problems: string[];
    reviewed: boolean;
    draft: boolean;
    keywords: string[];
    body: string;
    relativePath: string;
}

/**
 * How much of the prose of a lesson goes into the search index.
 *
 * The whole of it makes the index heavy enough that the reader waits for the
 * search, and the opening of a lesson carries the terms that a reader would
 * search for.
 */
const SEARCH_BODY_LIMIT = 1200;

async function loadLessons(): Promise<LoadedLesson[]> {
    const files = await fg("**/*.md", { cwd: DOCS_DIR, absolute: true, onlyFiles: true });
    const lessons: LoadedLesson[] = [];

    for (const file of files.sort()) {
        const source = await readFile(file, "utf8");
        const parsed = parseMarkdownFrontmatter(source);
        if (!parsed) continue;

        const relativePath = relative(DOCS_DIR, file).split("\\").join("/");
        if (relativePath.startsWith("implementations/")) continue;

        const result = lessonFrontmatterSchema.safeParse(parsed.data);
        if (!result.success) continue;

        const data = result.data;
        lessons.push({
            id: data.id,
            title: data.title,
            summary: data.summary ?? "",
            href: toRoute(relativePath),
            divisions: data.division as Division[],
            subjects: data.subjects as Subject[],
            importance: data.importance as Importance,
            level: data.level,
            prerequisites: data.prerequisites,
            complexity: data.complexity,
            assumptions: data.assumptions,
            implementations: data.implementations,
            visualization: data.visualization,
            problems: data.problems,
            reviewed: data.reviewed,
            draft: data.draft,
            keywords: collectKeywords(parsed.data),
            body: stripMarkdown(parsed.body),
            relativePath,
        });
    }

    return lessons;
}

interface LocatedManifest {
    manifest: AlgorithmManifest;
    directory: string;
}

async function loadManifests(): Promise<LocatedManifest[]> {
    const files = await fg("**/algorithm.yaml", {
        cwd: IMPLEMENTATIONS_DIR,
        absolute: true,
        onlyFiles: true,
    });
    const manifests: LocatedManifest[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        manifests.push({
            manifest: algorithmManifestSchema.parse(raw),
            directory: file.slice(0, -"/algorithm.yaml".length),
        });
    }
    return manifests;
}

async function loadProblems(): Promise<ProblemEntry[]> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "problems"),
        absolute: true,
        onlyFiles: true,
    });
    const problems: ProblemEntry[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const parsed = problemSchema.parse(raw);
        problems.push(parsed as ProblemEntry);
    }
    return problems;
}

async function loadVisualizations(): Promise<VisualizationEntry[]> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "visualizations"),
        absolute: true,
        onlyFiles: true,
    });
    const entries: VisualizationEntry[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const parsed = visualizationSchema.parse(raw);
        entries.push({
            id: parsed.id,
            title: parsed.title,
            algorithm: parsed.algorithm,
            scene: parsed.scene,
            preset: parsed.preset,
            href: `/laboratory/#${parsed.id}`,
            maxVertices: parsed.maxVertices,
            maxEdges: parsed.maxEdges,
        });
    }
    return entries;
}

async function loadCurriculum(): Promise<CurriculumTrack[]> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "curriculum"),
        absolute: true,
        onlyFiles: true,
    });
    const tracks: CurriculumTrack[] = [];
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const parsed = curriculumTrackSchema.parse(raw);
        tracks.push(parsed as CurriculumTrack);
    }
    return tracks;
}

async function loadSynonyms(): Promise<Record<string, string[]>> {
    const files = await fg("*.yaml", {
        cwd: join(ROOT, "data", "synonyms"),
        absolute: true,
        onlyFiles: true,
    });
    const merged: Record<string, string[]> = {};
    for (const file of files.sort()) {
        const raw = parseYaml(await readFile(file, "utf8"));
        const parsed = synonymsSchema.parse(raw);
        for (const [key, values] of Object.entries(parsed)) {
            merged[key] = [...(merged[key] ?? []), ...values];
        }
    }
    return merged;
}

/* ------------------------------------------------------------------ */
/* Prerequisite graph                                                  */
/* ------------------------------------------------------------------ */

function buildPrerequisiteGraph(lessons: LoadedLesson[]): PrerequisiteGraph {
    const known = new Set(lessons.map((lesson) => lesson.id));
    const nodes = lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        division: lesson.divisions[0],
    }));
    const edges: PrerequisiteGraph["edges"] = [];

    for (const lesson of lessons) {
        for (const target of lesson.prerequisites.required) {
            if (!known.has(target)) continue;
            edges.push({ from: target, to: lesson.id, kind: "required" });
        }
        for (const target of lesson.prerequisites.recommended) {
            if (!known.has(target)) continue;
            edges.push({ from: target, to: lesson.id, kind: "recommended" });
        }
    }

    // Kahn topological sort over the required edges only.
    const dependents = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    for (const lesson of lessons) indegree.set(lesson.id, 0);
    for (const edge of edges) {
        if (edge.kind !== "required") continue;
        dependents.set(edge.from, [...(dependents.get(edge.from) ?? []), edge.to]);
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    }

    const queue = [...indegree.entries()].filter(([, value]) => value === 0).map(([key]) => key);
    const order: string[] = [];
    while (queue.length) {
        const current = queue.shift()!;
        order.push(current);
        for (const next of dependents.get(current) ?? []) {
            const remaining = (indegree.get(next) ?? 0) - 1;
            indegree.set(next, remaining);
            if (remaining === 0) queue.push(next);
        }
    }

    return { nodes, edges, order };
}

/* ------------------------------------------------------------------ */
/* Search helpers                                                      */
/* ------------------------------------------------------------------ */

function expandSynonyms(keys: string[], synonyms: Record<string, string[]>): string[] {
    const expanded = new Set<string>();
    for (const key of keys) {
        expanded.add(key);
        const direct = synonyms[key];
        if (direct) for (const value of direct) expanded.add(value);
        for (const [canonical, values] of Object.entries(synonyms)) {
            if (values.some((value) => value.toLowerCase() === key.toLowerCase())) {
                expanded.add(canonical);
                for (const value of values) expanded.add(value);
            }
        }
    }
    return [...expanded];
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
    const [lessons, located, problems, visualizations, curriculum, synonyms] = await Promise.all([
        loadLessons(),
        loadManifests(),
        loadProblems(),
        loadVisualizations(),
        loadCurriculum(),
        loadSynonyms(),
    ]);

    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    // A lesson declares the algorithm it documents; the join runs the other way.
    const lessonByAlgorithm = new Map(
        lessons
            .filter((lesson) => lesson.implementations)
            .map((lesson) => [lesson.implementations!, lesson]),
    );

    /* Algorithms -------------------------------------------------------- */
    const algorithms: AlgorithmEntry[] = [];
    for (const { manifest } of located) {
        const lesson =
            lessonByAlgorithm.get(manifest.algorithm) ?? lessonById.get(manifest.algorithm);
        algorithms.push({
            id: manifest.algorithm,
            title: manifest.title,
            summary: manifest.summary,
            subject: manifest.subject as Subject,
            divisions: manifest.divisions as Division[],
            importance: manifest.importance as Importance,
            complexity: manifest.complexity,
            prerequisites: manifest.prerequisites,
            assumptions: manifest.assumptions,
            variants: manifest.variants.map((variant) => ({
                id: variant.id,
                language: variant.language as LanguageId,
                file: variant.file,
                kind: variant.kind,
                recommendation: variant.recommended,
                reason: variant.reason,
                time: variant.time,
                auxiliarySpace: variant.auxiliarySpace,
                status: variant.status,
                inputs: variant.inputs,
                outputs: variant.outputs,
                notes: variant.notes,
                operations: variant.operations,
            })),
            visualization: manifest.visualization,
            href: lesson?.href,
            reviewed: manifest.reviewed,
        });
    }

    /* Highlighted source ------------------------------------------------ */
    /* The fragment carries the colors of both appearances, so that the
       listing reads on a dark page as well as on a light one. The style
       sheet of the theme decides which of the two is shown. */
    const highlighter = await createHighlighter({
        themes: [aayntnLight, aayntnDark],
        langs: ["c", "cpp", "java", "python", "pascal", "javascript"],
    });

    const srcDir = join(GENERATED_DIR, "src");
    const publicImplDir = join(PUBLIC_DIR, "implementations");
    await rm(srcDir, { recursive: true, force: true });
    await rm(publicImplDir, { recursive: true, force: true });

    const sourcePages: {
        algorithm: AlgorithmEntry;
        files: {
            language: LanguageId;
            variant: string;
            file: string;
            sourcePath: string;
            source: string;
        }[];
    }[] = [];

    for (const { manifest, directory } of located) {
        const entry = algorithms.find((item) => item.id === manifest.algorithm)!;
        const files: {
            language: LanguageId;
            variant: string;
            file: string;
            sourcePath: string;
            source: string;
        }[] = [];

        for (const variant of manifest.variants) {
            const sourcePath = join(directory, variant.file);
            const source = await readFile(sourcePath, "utf8");
            const lang = SHIKI_LANG[variant.language] ?? "text";
            const html = highlighter.codeToHtml(source, {
                lang,
                themes: { light: "aayntn-light", dark: "aayntn-dark" },
                defaultColor: false,
                cssVariablePrefix: "--shiki-",
                transformers: [
                    {
                        name: "aayntn-line-numbers",
                        line(node, line) {
                            node.properties["data-line"] = String(line);
                        },
                    },
                ],
            });

            const publicDir = join(publicImplDir, manifest.algorithm);
            await mkdir(publicDir, { recursive: true });

            /*
             * The highlighted fragment is published as a plain file rather
             * than bundled, so that a reader downloads only the listing they
             * actually open.
             */
            await writeFile(
                join(publicDir, `${variant.language}.${variant.id}.html`),
                html,
                "utf8",
            );

            const publicName = `${variant.language}.${variant.id}.${FILE_EXTENSION[variant.language]}`;
            await writeFile(join(publicDir, publicName), source, "utf8");

            files.push({
                language: variant.language as LanguageId,
                variant: variant.id,
                file: variant.file,
                sourcePath: publicName,
                source,
            });
        }

        sourcePages.push({ algorithm: entry, files });
    }

    /* Search ------------------------------------------------------------ */
    const search: SearchEntry[] = [];

    for (const lesson of lessons) {
        search.push({
            id: `lesson:${lesson.id}`,
            title: lesson.title,
            summary: lesson.summary,
            href: lesson.href,
            kind: "lesson",
            keywords: expandSynonyms([lesson.id, ...lesson.keywords], synonyms),
        });
    }

    for (const algorithm of algorithms) {
        search.push({
            id: `algorithm:${algorithm.id}`,
            title: algorithm.title,
            summary: algorithm.summary,
            href: algorithm.href ?? `/algorithms/${algorithm.id.replace(/\./g, "/")}`,
            kind: "algorithm",
            keywords: expandSynonyms([algorithm.id.split(".").pop() ?? algorithm.id], synonyms),
        });
    }

    for (const problem of problems) {
        search.push({
            id: `problem:${problem.id}`,
            title: problem.title,
            summary: [problem.source, problem.contest, problem.techniques.join(", ")]
                .filter(Boolean)
                .join(" — "),
            href: problem.url ?? "/practice/",
            kind: "problem",
            keywords: expandSynonyms(problem.techniques, synonyms),
        });
    }

    for (const visualization of visualizations) {
        search.push({
            id: `visualization:${visualization.id}`,
            title: visualization.title,
            summary: `Interactive laboratory: ${visualization.algorithm}`,
            href: visualization.href,
            kind: "visualization",
            keywords: expandSynonyms([visualization.algorithm], synonyms),
        });
    }

    for (const language of ALL_LANGUAGES) {
        search.push({
            id: `language:${language}`,
            title: `${language} language center`,
            summary:
                "Container performance, input and output, recursion limits, and contest idioms.",
            href: `/languages/${language}/`,
            kind: "language",
            keywords: expandSynonyms([language], synonyms),
        });
    }

    const templateFiles = await fg("**/*", { cwd: TEMPLATES_DIR, absolute: true, onlyFiles: true });
    for (const file of templateFiles.sort()) {
        if (!/\.(md|template)$/.test(file)) continue;
        const relativePath = relative(TEMPLATES_DIR, file).split("\\").join("/");
        search.push({
            id: `template:${relativePath}`,
            title: `Template: ${basename(relativePath)}`,
            summary: "Reusable contest preparation pattern.",
            href: "/templates/",
            kind: "template",
            keywords: [],
        });
    }

    /* Search bodies: lesson prose is indexable as a separate field so that a
     query matches the explanation, not only the title. The prose is cut
     short, because the whole of it makes the index heavy enough that the
     reader waits for it, and the opening of a lesson carries the terms that
     a reader would search for. */
    const searchDocuments = search.map((entry) => {
        const lesson = lessons.find((item) => `lesson:${item.id}` === entry.id);
        return { ...entry, body: (lesson?.body ?? "").slice(0, SEARCH_BODY_LIMIT) };
    });

    await mkdir(PUBLIC_DIR, { recursive: true });
    await writeFile(
        join(PUBLIC_DIR, "search-index.json"),
        JSON.stringify({ entries: searchDocuments }),
        "utf8",
    );

    /* Publish the handcrafted diagrams. The sources live under
       diagrams/source so that they are first-class, source-controlled assets
       rather than something that only exists in the build output. */
    const diagramRoot = join(ROOT, "diagrams", "source");
    for (const group of ["ornaments", "diagrams"]) {
        const sourceDir = join(diagramRoot, group);
        if (!existsSync(sourceDir)) continue;
        const targetDir = join(PUBLIC_DIR, group);
        await rm(targetDir, { recursive: true, force: true });
        await mkdir(targetDir, { recursive: true });
        for (const file of await fg("*.svg", { cwd: sourceDir, absolute: true, onlyFiles: true })) {
            await writeFile(join(targetDir, basename(file)), await readFile(file, "utf8"), "utf8");
        }
    }

    /* Write the index documents ----------------------------------------- */
    await mkdir(GENERATED_DIR, { recursive: true });

    const lessonEntries: LessonEntry[] = lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        href: lesson.href,
        divisions: lesson.divisions,
        importance: lesson.importance,
        subjects: lesson.subjects,
        level: lesson.level,
    }));

    const languages = ALL_LANGUAGES.map((id) => ({
        id,
        label:
            id === "cpp17" ? "C++17" : id === "c" ? "C" : id.charAt(0).toUpperCase() + id.slice(1),
        submittable: id === "c" || id === "cpp17" || id === "java" || id === "python",
        href: `/languages/${id}/`,
    }));

    const stats = {
        lessons: lessons.length,
        algorithms: algorithms.length,
        variants: algorithms.reduce((sum, algorithm) => sum + algorithm.variants.length, 0),
        problems: problems.length,
        visualizations: visualizations.length,
        reviewedAlgorithms: algorithms.filter((algorithm) => algorithm.reviewed).length,
    };

    const output: Record<string, unknown> = {
        algorithms,
        lessons: lessonEntries,
        problems,
        visualizations,
        curriculum,
        languages,
        prerequisites: buildPrerequisiteGraph(lessons),
        search,
        stats,
    };

    for (const [name, value] of Object.entries(output)) {
        await writeFile(
            join(GENERATED_DIR, `${name}.json`),
            JSON.stringify(value, null, 2),
            "utf8",
        );
    }

    /* Stable per-algorithm source pages ---------------------------------- */
    /*
     * One page per variant rather than one page per algorithm. A page that
     * carries every listing of an algorithm is several hundred kilobytes of
     * markup, which the client-side router then has to carry as a script.
     * Splitting them keeps every page small and gives each listing its own
     * address, which is what a reader who wants to copy one implementation
     * actually wants.
     */
    const implPagesDir = join(DOCS_DIR, "implementations");
    await rm(implPagesDir, { recursive: true, force: true });
    await mkdir(implPagesDir, { recursive: true });

    /*
     * The root of the source tree. Every listing the encyclopedia publishes
     * is reachable from here, so that a reader who wants the code rather than
     * the article has one page to start from.
     */
    const root: string[] = [];
    root.push("---");
    root.push("id: implementation.index");
    root.push("title: The source of every listing");
    root.push(
        "summary: Every implementation that the encyclopedia publishes, with the languages it is written in and the article that explains it.",
    );
    root.push("subjects: []");
    root.push("importance: extended-reference");
    root.push("reviewed: false");
    root.push("---");
    root.push("");
    root.push("# The source of every listing");
    root.push("");
    root.push(
        "Every implementation in the encyclopedia is a real source file in the language it claims to be. The test suite compiles each one, runs it against shared fixtures, and requires the six languages of an algorithm to produce the same output byte for byte.",
    );
    root.push("");
    root.push(
        "This page lists the source of every algorithm. Each link leads to the files of one algorithm, with a page for every language and variant.",
    );
    root.push("");
    root.push("| Algorithm | Subject | Languages | Source |");
    root.push("| --- | --- | --- | --- |");
    for (const { algorithm, files } of [...sourcePages].sort((a, b) =>
        a.algorithm.title.localeCompare(b.algorithm.title),
    )) {
        const languages = [
            ...new Set(files.map((file) => LANGUAGE_LABEL[file.language] ?? file.language)),
        ];
        root.push(
            `| ${algorithm.title} | ${algorithm.subject} | ${languages.join(", ")} | [${files.length} listing${files.length === 1 ? "" : "s"}](/implementations/${algorithm.id.replace(/\./g, "-")}/) |`,
        );
    }
    root.push("");
    root.push(
        `That is ${sourcePages.reduce((total, item) => total + item.files.length, 0)} listings across ${sourcePages.length} algorithms.`,
    );
    root.push("");
    await writeFile(join(implPagesDir, "index.md"), root.join("\n"), "utf8");

    for (const { algorithm, files } of sourcePages) {
        const algorithmDir = join(implPagesDir, algorithm.id.replace(/\./g, "-"));
        await mkdir(algorithmDir, { recursive: true });

        const index: string[] = [];
        index.push("---");
        index.push(`id: implementation.${algorithm.id}`);
        index.push(`title: ${algorithm.title} — source`);
        index.push(`summary: Every implementation of ${algorithm.title} in A.A.Y.N.T.N..`);
        index.push("subjects:");
        index.push(`  - ${algorithm.subject}`);
        index.push("importance: extended-reference");
        index.push("reviewed: false");
        index.push("---");
        index.push("");
        index.push(`# ${algorithm.title} — source`);
        index.push("");
        index.push(algorithm.summary);
        index.push("");
        index.push(
            "The listings below are the real source files used by the encyclopedia. Every one of them is compiled and executed against shared fixtures by the test suite in continuous integration.",
        );
        index.push("");

        for (const file of files) {
            const slug = `${file.language}-${file.variant}`;
            const label = `${LANGUAGE_LABEL[file.language] ?? file.language} — ${file.variant}`;

            index.push(
                `- [${label}](/implementations/${algorithm.id.replace(/\./g, "-")}/${slug})`,
            );
        }
        index.push("");

        await writeFile(join(algorithmDir, "index.md"), index.join("\n"), "utf8");

        for (const file of files) {
            const slug = `${file.language}-${file.variant}`;
            const label = `${LANGUAGE_LABEL[file.language] ?? file.language} — ${file.variant}`;
            const page: string[] = [];
            page.push("---");
            page.push(`id: implementation.${algorithm.id}.${file.variant}.${file.language}`);
            page.push(`title: ${algorithm.title} — ${label}`);
            page.push(
                `summary: The ${LANGUAGE_LABEL[file.language] ?? file.language} ${file.variant} implementation of ${algorithm.title}.`,
            );
            page.push("subjects:");
            page.push(`  - ${algorithm.subject}`);
            page.push("importance: extended-reference");
            page.push("reviewed: false");
            page.push("---");
            page.push("");
            page.push(`# ${algorithm.title} — ${label}`);
            page.push("");
            page.push(algorithm.summary);
            page.push("");
            page.push(
                "This is the real source file used by the encyclopedia. It is compiled and executed against the shared fixtures by the test suite in continuous integration, and it is required to produce the same output as the other five languages.",
            );
            page.push("");
            page.push(`Source file: \`${file.sourcePath}\``);
            page.push("");
            page.push("```" + (SHIKI_LANG[file.language] ?? "text"));
            page.push(file.source.trimEnd());
            page.push("```");
            page.push("");
            page.push(
                `Back to [the ${algorithm.title} source index](/implementations/${algorithm.id.replace(/\./g, "-")}/).`,
            );
            page.push("");

            await writeFile(join(algorithmDir, `${slug}.md`), page.join("\n"), "utf8");
        }
    }

    /* Fill the generated regions of the encyclopedia index. ------------- */
    await fillGeneratedRegions(DOCS_DIR, lessons, algorithms);

    process.stdout.write(
        `generated ${lessons.length} lessons, ${algorithms.length} algorithms, ` +
            `${stats.variants} implementations, ${problems.length} problems, ` +
            `${visualizations.length} visualizations\n`,
    );
}

/**
 * Replace the marked regions of a page with tables built from the metadata.
 *
 * The encyclopedia index carries a table of the subjects and a table of every
 * technique. Both are generated, so that neither can drift away from the
 * articles they describe.
 */
async function fillGeneratedRegions(
    dir: string,
    lessons: LoadedLesson[],
    algorithms: AlgorithmEntry[],
): Promise<void> {
    const index = join(dir, "algorithms", "index.md");
    if (!existsSync(index)) return;

    const source = await readFile(index, "utf8");

    const subjectRows = SUBJECTS.map((subject) => {
        const techniques = lessons
            .filter(
                (lesson) =>
                    lesson.subjects.includes(subject) &&
                    lesson.href.startsWith(`/algorithms/${subject}/`) &&
                    lesson.href !== `/algorithms/${subject}`,
            )
            .map((lesson) => lesson.title);
        const list = techniques.length === 0 ? "no technique yet" : techniques.join(", ");
        return `| ${SUBJECT_LABELS[subject]} | ${list} | [${SUBJECT_LABELS[subject]}](/algorithms/${subject}/) |`;
    }).join("\n");

    const coreRows = lessons
        .filter(
            (lesson) =>
                lesson.href.startsWith("/algorithms/") &&
                // A subject page has one segment after the subject; a technique
                // article has at least two.
                lesson.href.split("/").length > 3,
        )
        .map((lesson) => {
            const algorithm = algorithms.find((entry) => entry.id === lesson.implementations);
            const time = lesson.complexity?.time ?? algorithm?.complexity.time ?? "varies";
            const space = lesson.complexity?.space ?? algorithm?.complexity.space ?? "varies";
            const requires = lesson.prerequisites.required[0] ?? "none";
            return `| ${lesson.title} | ${time} | ${space} | \`${requires}\` | [${lesson.title}](${lesson.href}) |`;
        })
        .join("\n");

    let updated = source.replace(
        /<!-- aayntn:subjects:start -->[\s\S]*?<!-- aayntn:subjects:end -->/,
        `<!-- aayntn:subjects:start -->\n\n| Subject | Techniques it contains | Page |\n| --- | --- | --- |\n${subjectRows}\n\n<!-- aayntn:subjects:end -->`,
    );
    updated = updated.replace(
        /<!-- aayntn:core:start -->[\s\S]*?<!-- aayntn:core:end -->/,
        `<!-- aayntn:core:start -->\n\n| Technique | Time | Space | Requires | Article |\n| --- | --- | --- | --- | --- |\n${coreRows}\n\n<!-- aayntn:core:end -->`,
    );

    if (updated !== source) await writeFile(index, updated, "utf8");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
