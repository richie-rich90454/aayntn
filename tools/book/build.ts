/**
 * Build the printable edition of the encyclopedia.
 *
 * The output is one self-contained HTML document at `docs/public/book/`.
 * It contains every lesson in reading order, the same KaTeX and Shiki
 * rendering the site uses, a language chooser and a section chooser. The PDF
 * tool prints this document; it never prints the site.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import fg from "fast-glob";
import type { RendererRule } from "markdown-it";
import { DOCS_DIR, PUBLIC_DIR, ROOT, parseMarkdownFrontmatter } from "../lib/paths.ts";
import { createBookMarkdown, escapeHtml } from "./render.ts";

interface Page {
    file: string;
    relative: string;
    key: string;
    sitePath: string;
    anchor: string;
    title: string;
    summary: string;
    section: string;
    html: string;
}

interface Section {
    id: string;
    label: string;
    pages: Page[];
}

const SECTIONS = [
    { id: "start", label: "Start" },
    { id: "curriculum", label: "Curriculum" },
    { id: "algorithms", label: "Algorithms" },
    { id: "mathematics", label: "Mathematics" },
    { id: "templates", label: "Templates" },
    { id: "languages", label: "Languages" },
    { id: "practice", label: "Practice" },
    { id: "contest", label: "Contest" },
    { id: "debugging", label: "Debugging" },
    { id: "laboratory", label: "Laboratory" },
    { id: "reference", label: "Reference" },
    { id: "about", label: "About" },
] as const;

const ALGORITHM_SUBJECTS = [
    "foundations",
    "enumeration",
    "searching",
    "greedy",
    "arrays",
    "range-queries",
    "graphs",
    "trees",
    "dynamic-programming",
    "strings",
    "number-theory",
    "combinatorics",
    "geometry",
    "advanced",
] as const;

const LANGUAGE_ORDER = ["c", "cpp17", "java", "python", "pascal", "javascript"] as const;

const CURRICULUM_ORDER = ["bronze", "silver", "gold", "platinum"] as const;

const EXCLUDED = [
    "docs/book/**",
    "docs/style-guide/**",
    "docs/coverage/**",
    "docs/implementations/**",
];

function natural(left: string, right: string): number {
    return left.localeCompare(right, "en", { numeric: true });
}

function pageKey(relative: string): string {
    const withoutExtension = relative.replace(/\.md$/, "");
    if (withoutExtension === "index") return "";
    return withoutExtension.replace(/\/index$/, "");
}

function pageAnchor(key: string): string {
    if (key === "") return "page-home";
    return `page-${key
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()}`;
}

function firstHeading(body: string): string | null {
    const match = /^#\s+(.+)$/m.exec(body);
    return match ? match[1]!.trim() : null;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function attribute(source: string, name: string): string {
    const doubleQuoted = new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(source);
    if (doubleQuoted) return doubleQuoted[1] ?? "";
    const singleQuoted = new RegExp(`${name}\\s*=\\s*'([^']*)'`).exec(source);
    return singleQuoted?.[1] ?? "";
}

/**
 * Replace the site's Vue-only blocks with HTML that survives a static
 * document. The MathPanel is the only component that carries prose, so it
 * becomes a styled block and its Markdown continues to render normally.
 */
function prepareBody(body: string): string {
    let prepared = body.replace(/\r\n/g, "\n");

    // A page may import its components and its own data in a script block.
    // The printed book has neither, so the block is removed before rendering.
    prepared = prepared.replace(/<script\b[\s\S]*?<\/script>\s*/g, "");

    prepared = prepared.replace(/^<MathPanel([^>]*)>[ \t]*$/gm, (_match, attributes: string) => {
        const type = (attribute(attributes, "type") || "note")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");
        const title = attribute(attributes, "title");
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const titleHtml = title
            ? `\n\n<p class="book-panel__title">${escapeHtml(title)}</p>\n\n`
            : "\n\n";
        return `<div class="book-panel book-panel--${type}">\n\n<p class="book-panel__label">${escapeHtml(label)}</p>${titleHtml}`;
    });
    prepared = prepared.replace(/^<\/MathPanel>[ \t]*$/gm, "\n\n</div>\n\n");

    prepared = prepared.replace(/^<Synonyms\b[^>]*\/>\s*$/gm, "");
    prepared = prepared.replace(/^<PrerequisiteGraph\b[^>]*\/>\s*$/gm, "");
    prepared = prepared.replace(
        /^<(?:AlgorithmSummary|CodeViewer|PracticeCatalog|ProgressDashboard|LearnNext|ContestSimulation)\b[^>]*\/>\s*$/gm,
        "",
    );
    prepared = prepared.replace(/^<(?:Figure|Banner|Ornament)\b[^>]*\/>\s*$/gm, "");

    prepared = prepared.replace(
        /^<AlgorithmPlayer\b([^>]*)\/>\s*$/gm,
        (_match, attributes: string) => {
            const algorithm = attribute(attributes, "algorithm");
            if (!algorithm) return "";
            return `<p class="book-note">Interactive demonstration: <code>${escapeHtml(algorithm)}</code>. The step-by-step player is available on the website.</p>`;
        },
    );

    // Headings may carry an explicit identifier, used by links inside the
    // laboratory. Keep the identifier as an anchor the table of contents and
    // cross-page links can reach.
    prepared = prepared.replace(
        /^(#{1,6})\s+(.+?)\s*\{#([^}\s]+)\}\s*$/gm,
        (_match, hashes: string, heading: string, id: string) =>
            `${hashes} ${heading}\n\n<a id="__ANCHOR__-${id}"></a>`,
    );

    return prepared;
}

function rewriteHref(href: string, page: Page, pages: Map<string, Page>): string {
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href)) return href;
    if (/^(?:mailto|tel|data|blob):/i.test(href)) return href;

    if (href.startsWith("#")) {
        const hash = href.slice(1);
        if (!hash || hash.startsWith("languages=")) return href;
        return `#${page.anchor}-${hash}`;
    }

    let url: URL;
    try {
        url = new URL(href, `https://aayntn.invalid${page.sitePath}`);
    } catch {
        return href;
    }

    const key = decodeURIComponent(url.pathname)
        .replace(/^\/+|\/+$/g, "")
        .replace(/\/index$/, "");
    const target = pages.get(key);
    if (!target) return href;

    const hash = decodeURIComponent(url.hash.replace(/^#/, ""));
    return hash ? `#${target.anchor}-${hash}` : `#${target.anchor}`;
}

function installRenderRules(
    md: Awaited<ReturnType<typeof createBookMarkdown>>["md"],
    pages: Map<string, Page>,
): void {
    const link: RendererRule = (tokens, index, options, env, self) => {
        const page = (env as { page?: Page }).page;
        const token = tokens[index]!;
        const href = token.attrGet("href");
        if (href !== null && href !== undefined && page) {
            token.attrSet("href", rewriteHref(String(href), page, pages));
        }
        return self.renderToken(tokens, index, options);
    };
    md.renderer.rules["link_open"] = link;

    const heading: RendererRule = (tokens, index, options, env, self) => {
        const state = env as { pageAnchor?: string; used?: Set<string> };
        const token = tokens[index]!;
        const inline = tokens[index + 1];
        const content = inline && inline.type === "inline" ? inline.content : "";
        const base = slugify(content) || "section";
        let slug = base;
        let suffix = 2;
        while (state.used?.has(slug)) slug = `${base}-${suffix++}`;
        state.used?.add(slug);
        token.attrSet("id", `${state.pageAnchor ?? "page"}-${slug}`);
        return self.renderToken(tokens, index, options);
    };
    md.renderer.rules["heading_open"] = heading;
}

function orderPages(pages: Page[]): Page[] {
    const remaining = new Map(pages.map((page) => [page.relative, page]));
    const ordered: Page[] = [];
    const take = (relative: string): void => {
        const page = remaining.get(relative);
        if (!page) return;
        ordered.push(page);
        remaining.delete(relative);
    };
    const takeSorted = (filter: (page: Page) => boolean): void => {
        const entries = [...remaining.values()]
            .filter(filter)
            .sort((left, right) => natural(left.relative, right.relative));
        for (const page of entries) take(page.relative);
    };

    const sectionOf = (page: Page): string => page.section;

    // Start: the homepage frontispiece, then the academy.
    take("index.md");
    take("start/index.md");
    take("start/from-ap-csa/index.md");
    takeSorted((page) => sectionOf(page) === "start");

    take("curriculum/index.md");
    for (const division of CURRICULUM_ORDER) take(`curriculum/${division}/index.md`);
    takeSorted((page) => sectionOf(page) === "curriculum");

    take("algorithms/index.md");
    for (const subject of ALGORITHM_SUBJECTS) {
        take(`algorithms/${subject}/index.md`);
        takeSorted((page) => page.relative.startsWith(`algorithms/${subject}/`));
    }
    takeSorted((page) => sectionOf(page) === "algorithms");

    for (const section of ["mathematics", "templates", "contest", "debugging", "laboratory"]) {
        take(`${section}/index.md`);
        takeSorted((page) => sectionOf(page) === section);
    }

    take("languages/index.md");
    for (const language of LANGUAGE_ORDER) take(`languages/${language}/index.md`);
    takeSorted((page) => sectionOf(page) === "languages");

    take("practice/index.md");
    take("progress/index.md");
    takeSorted((page) => sectionOf(page) === "practice");

    take("reference/index.md");
    take("reference/usaco-rules.md");
    take("reference/contest-checklist.md");
    take("reference/glossary.md");
    takeSorted((page) => sectionOf(page) === "reference");

    take("about.md");
    takeSorted((page) => sectionOf(page) === "about");

    // Anything added to the documentation later still belongs in the book.
    for (const page of [...remaining.values()].sort((left, right) =>
        natural(left.relative, right.relative),
    )) {
        ordered.push(page);
    }

    return ordered;
}

function sectionPages(pages: Page[]): Section[] {
    return SECTIONS.map((section) => ({
        id: section.id,
        label: section.label,
        pages: pages.filter((page) => page.section === section.id),
    })).filter((section) => section.pages.length > 0);
}

function chapterHtml(section: Section): string {
    const chapters = section.pages
        .map(
            (
                page,
            ) => `<section class="book-chapter" data-section="${section.id}" id="${page.anchor}">
<h1>${escapeHtml(page.title)}</h1>
${page.summary ? `<p class="book-chapter__summary">${escapeHtml(page.summary)}</p>` : ""}
${page.html}
</section>`,
        )
        .join("\n");
    return `<section class="book-section" data-section="${section.id}" id="section-${section.id}">
${chapters}
</section>`;
}

function contentsHtml(sections: Section[]): string {
    const items = sections
        .map(
            (
                section,
            ) => `<li class="book-toc__section" data-section="${section.id}">${escapeHtml(section.label)}
<ol>
${section.pages
    .map(
        (page) =>
            `<li data-section="${section.id}"><a href="#${page.anchor}">${escapeHtml(page.title)}</a></li>`,
    )
    .join("\n")}
</ol>
</li>`,
        )
        .join("\n");
    return `<nav class="book-toc" aria-label="Contents">
<h2>Contents</h2>
<ol>
${items}
</ol>
</nav>`;
}

function languageControls(): string {
    const labels: Record<string, string> = {
        c: "C",
        cpp17: "C++17",
        java: "Java",
        python: "Python",
        pascal: "Pascal",
        javascript: "JavaScript",
    };
    return LANGUAGE_ORDER.map(
        (language) =>
            `<label><input type="checkbox" data-language-toggle value="${language}" checked> ${labels[language]}</label>`,
    ).join("\n");
}

function sectionControls(): string {
    return SECTIONS.map(
        (section) =>
            `<label><input type="checkbox" data-section-toggle value="${section.id}" checked> ${section.label}</label>`,
    ).join("\n");
}

const SCRIPT = `(() => {
    const aliases = {
        c: ["c"],
        cpp17: ["cpp17", "cpp"],
        cpp: ["cpp17", "cpp"],
        "c++": ["cpp17", "cpp"],
        java: ["java"],
        python: ["python"],
        py: ["python"],
        pascal: ["pascal"],
        pas: ["pascal"],
        javascript: ["javascript"],
        js: ["javascript"],
    };
    const defaults = ["c", "cpp17", "java", "python", "pascal", "javascript"];
    const root = document.documentElement;
    const languageBoxes = Array.from(document.querySelectorAll("[data-language-toggle]"));
    const sectionBoxes = Array.from(document.querySelectorAll("[data-section-toggle]"));
    const hash = location.hash.startsWith("#languages=")
        ? location.hash.slice("#languages=".length)
        : "";
    const requested = (new URLSearchParams(location.search).get("languages") ?? hash)
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    const selected = new Set();

    if (requested.length === 0) {
        for (const language of defaults) selected.add(language);
    } else {
        for (const item of requested) {
            for (const language of aliases[item] ?? []) selected.add(language);
        }
    }

    if (selected.size === 0) {
        for (const language of defaults) selected.add(language);
    }

    for (const box of languageBoxes) {
        box.checked = selected.has(box.value) || (box.value === "cpp17" && selected.has("cpp"));
    }

    const applyLanguages = () => {
        const active = languageBoxes.filter((box) => box.checked).map((box) => box.value);
        root.dataset.languages = active.join(" ");
    };

    const applySections = () => {
        const hidden = sectionBoxes.filter((box) => !box.checked).map((box) => box.value);
        if (hidden.length) root.dataset.hiddenSections = hidden.join(" ");
        else delete root.dataset.hiddenSections;
    };

    for (const box of languageBoxes) box.addEventListener("change", applyLanguages);
    for (const box of sectionBoxes) box.addEventListener("change", applySections);

    applyLanguages();
    if (location.hash.startsWith("#languages=")) {
        history.replaceState(null, "", location.pathname + location.search);
    }
})();`;

function documentHtml(sections: Section[], bookCss: string, katexCss: string): string {
    const body = sections.map(chapterHtml).join("\n");
    return `<!doctype html>
<html lang="en" data-languages="c cpp17 java python pascal javascript">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>All Algorithms You Need to Know</title>
<meta name="description" content="The printable edition of A.A.Y.N.T.N., the competitive programming encyclopedia.">
<style>${katexCss}
${bookCss}</style>
</head>
<body class="book">
<header class="book-controls">
<div class="book-controls__inner">
<div class="book-controls__group">
<p class="book-controls__title">Language</p>
${languageControls()}
</div>
<div class="book-controls__group">
<p class="book-controls__title">Sections</p>
${sectionControls()}
</div>
</div>
</header>
<div class="book-frontmatter">
<section class="book-cover">
<p class="book-cover__mark">A.A.Y.N.T.N.</p>
<h1>All Algorithms You Need to Know</h1>
<p class="book-cover__subtitle">A complete competitive programming encyclopedia, from AP Computer Science A through USACO Platinum and beyond.</p>
<p class="book-cover__note"><strong>Revision material.</strong> Algorithm resources and pre-written templates may not be consulted during an active contest. This book is for preparation and review; the two-page language card is the permitted contest reference.</p>
</section>
${contentsHtml(sections)}
</div>
<main class="book-document">
${body}
</main>
<footer class="book-end">
<p>Generated from the aayntn sources. The book is revision material; the language card is the permitted contest reference.</p>
</footer>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

async function main(): Promise<void> {
    const files = await fg("docs/**/*.md", {
        cwd: ROOT,
        absolute: true,
        onlyFiles: true,
        ignore: EXCLUDED,
    });

    const included = files.filter((file) => !/(^|\/)404[^/]*\.md$/i.test(file)).sort(natural);

    const pages: Page[] = [];
    for (const file of included) {
        const relative = file
            .slice(DOCS_DIR.length + 1)
            .split("\\")
            .join("/");
        const source = await readFile(file, "utf8");
        const parsed = parseMarkdownFrontmatter(source);
        const data = parsed?.data ?? {};
        const rawBody = parsed?.body ?? source;
        const key = pageKey(relative);
        const top = relative === "index.md" ? "start" : relative.split("/")[0]!;
        const aliases: Record<string, string> = {
            progress: "practice",
            download: "about",
        };
        const section = SECTIONS.some((entry) => entry.id === top)
            ? top
            : (aliases[top] ?? "about");
        const title =
            typeof data["title"] === "string" ? data["title"] : (firstHeading(rawBody) ?? relative);
        const summary = typeof data["summary"] === "string" ? data["summary"] : "";
        const body = relative === "index.md" ? summary : prepareBody(rawBody);

        pages.push({
            file,
            relative,
            key,
            sitePath: key === "" ? "/" : `/${key}${relative.endsWith("/index.md") ? "/" : ""}`,
            anchor: pageAnchor(key),
            title,
            summary,
            section,
            html: body,
        });
    }

    const ordered = orderPages(pages);
    const pageMap = new Map(ordered.map((page) => [page.key, page]));
    const { md } = await createBookMarkdown();
    installRenderRules(md, pageMap);

    for (const page of ordered) {
        const rendered = md
            .render(page.html, {
                page,
                pageAnchor: page.anchor,
                used: new Set<string>(),
            })
            .replace(/__ANCHOR__/g, page.anchor)
            .trim();
        // Raw HTML blocks in the Markdown do not pass through the link
        // renderer, so their internal addresses are rewritten here as well.
        page.html = rendered.replace(
            /(href)=(["'])(\/[^"']*)\2/g,
            (match, attribute: string, quote: string, href: string) => {
                const next = rewriteHref(href, page, pageMap);
                return next === href ? match : `${attribute}=${quote}${next}${quote}`;
            },
        );
    }

    const sections = sectionPages(ordered);
    const bookCss = await readFile(
        join(ROOT, "docs", ".vitepress", "theme", "styles", "book.css"),
        "utf8",
    );
    const katexCss = (
        await readFile(join(ROOT, "node_modules", "katex", "dist", "katex.min.css"), "utf8")
    ).replace(/@font-face\{[^}]*\}/g, "");

    const output = join(PUBLIC_DIR, "book", "index.html");
    await mkdir(dirname(output), { recursive: true });
    const base = process.env["AAYNTN_BASE"] ?? "/";
    const html = documentHtml(sections, bookCss, katexCss);
    const published =
        base === "/"
            ? html
            : html.replace(
                  /(href|src)="\/(?!\/)([^"]*)"/g,
                  (whole, attribute: string, value: string) =>
                      value.startsWith(base.slice(1)) ? whole : `${attribute}="${base}${value}"`,
              );
    await writeFile(output, published, "utf8");
    process.stdout.write(
        `book: ${ordered.length} chapters, ${sections.length} sections, ${output}\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
