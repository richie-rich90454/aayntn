/**
 * Generate every derived artefact in the site.
 *
 * Sources of truth:
 *   docs (recursive)               editorial content and lesson frontmatter
 *   implementations (recursive)    implementation manifests
 *   data/problems (one dir)       problem catalogue
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
import { aayntnLight } from "../../docs/.vitepress/theme/shiki-theme.ts";
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

const SHIKI_LANG: Record<string, string> = {
    c: "c",
    cpp17: "cpp",
    java: "java",
    python: "python",
    pascal: "pascal",
    javascript: "javascript",
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
    return withIndex === "" ? "/" : withIndex;
}

function collectKeywords(data: Record<string, unknown>): string[] {
    const raw = data.keywords;
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

    /* Algorithms -------------------------------------------------------- */
    const algorithms: AlgorithmEntry[] = [];
    for (const { manifest } of located) {
        const lesson = lessonById.get(manifest.implementations ?? manifest.algorithm);
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
    const highlighter = await createHighlighter({
        themes: [aayntnLight],
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
                theme: "aayntn-light",
                transformers: [
                    {
                        name: "aayntn-line-numbers",
                        line(node, line) {
                            node.properties["data-line"] = String(line);
                        },
                    },
                ],
            });

            const outDir = join(srcDir, manifest.algorithm);
            await mkdir(outDir, { recursive: true });
            await writeFile(join(outDir, `${variant.language}.${variant.id}.html`), html, "utf8");

            const publicDir = join(publicImplDir, manifest.algorithm);
            await mkdir(publicDir, { recursive: true });
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
                .join(" · "),
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
     query matches the explanation, not only the title. */
    const searchDocuments = search.map((entry) => {
        const lesson = lessons.find((item) => `lesson:${item.id}` === entry.id);
        return { ...entry, body: lesson?.body ?? "" };
    });

    await mkdir(PUBLIC_DIR, { recursive: true });
    await writeFile(
        join(PUBLIC_DIR, "search-index.json"),
        JSON.stringify({ entries: searchDocuments }),
        "utf8",
    );

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
    const implPagesDir = join(DOCS_DIR, "implementations");
    await rm(implPagesDir, { recursive: true, force: true });
    await mkdir(implPagesDir, { recursive: true });

    for (const { algorithm, files } of sourcePages) {
        const lines: string[] = [];
        lines.push("---");
        lines.push(`id: implementation.${algorithm.id}`);
        lines.push(`title: ${algorithm.title} — source`);
        lines.push(`summary: Every implementation of ${algorithm.title} in aayntn.`);
        lines.push("subjects:");
        lines.push(`  - ${algorithm.subject}`);
        lines.push("importance: extended-reference");
        lines.push("reviewed: false");
        lines.push("---");
        lines.push("");
        lines.push(`# ${algorithm.title} — source`);
        lines.push("");
        lines.push(algorithm.summary);
        lines.push("");
        lines.push(
            "The listings below are the real source files used by the encyclopedia. Every one of them is compiled and executed against shared fixtures by the test suite in CI.",
        );
        lines.push("");
        for (const file of files) {
            lines.push(`## ${file.language} — ${file.variant}`);
            lines.push("");
            lines.push(`Source file: \`${file.sourcePath}\``);
            lines.push("");
            lines.push("```" + (SHIKI_LANG[file.language] ?? "text"));
            lines.push(file.source.trimEnd());
            lines.push("```");
            lines.push("");
        }
        await writeFile(
            join(implPagesDir, `${algorithm.id.replace(/\./g, "-")}.md`),
            lines.join("\n"),
            "utf8",
        );
    }

    process.stdout.write(
        `generated ${lessons.length} lessons, ${algorithms.length} algorithms, ` +
            `${stats.variants} implementations, ${problems.length} problems, ` +
            `${visualizations.length} visualizations\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
