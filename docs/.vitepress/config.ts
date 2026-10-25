import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { katex } from "@mdit/plugin-katex";
import type { DefaultTheme } from "vitepress";
import type { LanguageInput } from "shiki";
import { aayntnDark, aayntnLight } from "./theme/shiki-theme";
import { katexMacros } from "./theme/katex-macros";
import { mathPanel } from "./theme/markdown/math-panel";
import { REPOSITORY_URL } from "./theme/repository";

/**
 * aayntn — All Algorithms You Need to Know
 *
 * A statically generated competitive-programming encyclopedia. Every editorial
 * page is an ordinary Markdown file; every implementation is a real source file
 * in the language it claims to be; every interactive visualization is driven by
 * deterministic TypeScript reference code.
 */

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export interface NavigationLink {
    text: string;
    description: string;
    link: string;
}

export interface NavigationGroup {
    text: string;
    activeMatch?: string;
    items: NavigationLink[];
}

const nav: NavigationGroup[] = [
    {
        text: "Learn",
        items: [
            {
                text: "Start here",
                description: "What this encyclopedia is and how to read it.",
                link: "/start/",
            },
            {
                text: "Curriculum",
                description: "Bronze to Platinum, one division at a time.",
                link: "/curriculum/",
            },
            {
                text: "Practice",
                description: "Problems sorted by technique and division.",
                link: "/practice/",
            },
            {
                text: "Contest",
                description: "A timed simulation under contest rules.",
                link: "/contest/",
            },
        ],
    },
    {
        text: "Reference",
        activeMatch: "/reference/",
        items: [
            {
                text: "Algorithms",
                description: "Every subject, with proofs and six-language code.",
                link: "/algorithms/",
            },
            {
                text: "Mathematics",
                description: "The derivations that the algorithms rest on.",
                link: "/mathematics/",
            },
            {
                text: "Templates",
                description: "Contest-ready code to adapt, not paste.",
                link: "/templates/",
            },
            {
                text: "Languages",
                description: "One technique written in six languages.",
                link: "/languages/",
            },
        ],
    },
    {
        text: "Tools",
        items: [
            {
                text: "Laboratory",
                description: "Step through an algorithm one operation at a time.",
                link: "/laboratory/",
            },
            {
                text: "Debugging",
                description: "Find the fault in a solution that fails quietly.",
                link: "/debugging/",
            },
            {
                text: "My progress",
                description: "What you have read and what comes next.",
                link: "/progress/",
            },
            {
                text: "Coverage",
                description: "Which subjects have a full lesson and which do not.",
                link: "/coverage/",
            },
        ],
    },
    {
        text: "About",
        items: [
            {
                text: "About",
                description: "Who writes this, and why it stays free.",
                link: "/about",
            },
            {
                text: "Download",
                description: "Take the encyclopedia offline.",
                link: "/download/",
            },
            {
                text: "Glossary",
                description: "Every term the lessons use, defined once.",
                link: "/reference/glossary",
            },
            {
                text: "Changelog",
                description: "What changed, newest first.",
                link: "/changelog/",
            },
        ],
    },
];

/* ------------------------------------------------------------------ */
/* Sidebars                                                            */
/* ------------------------------------------------------------------ */

const algorithmsSidebar: DefaultTheme.SidebarItem[] = [
    {
        text: "Encyclopedia",
        collapsed: false,
        items: [
            { text: "All subjects", link: "/algorithms/" },
            { text: "Foundations and complexity", link: "/algorithms/foundations/" },
            { text: "Enumeration and searching", link: "/algorithms/enumeration/" },
            { text: "Greedy methods", link: "/algorithms/greedy/" },
            { text: "Arrays and sequences", link: "/algorithms/arrays/" },
            { text: "Range query structures", link: "/algorithms/range-queries/" },
            { text: "Graphs and shortest paths", link: "/algorithms/graphs/" },
            { text: "Trees and decompositions", link: "/algorithms/trees/" },
            { text: "Dynamic programming", link: "/algorithms/dynamic-programming/" },
            { text: "Strings", link: "/algorithms/strings/" },
            { text: "Number theory", link: "/algorithms/number-theory/" },
            { text: "Combinatorics", link: "/algorithms/combinatorics/" },
            { text: "Computational geometry", link: "/algorithms/geometry/" },
            { text: "Advanced techniques", link: "/algorithms/advanced/" },
        ],
    },
    {
        text: "Core algorithms",
        collapsed: false,
        items: [
            { text: "Binary search", link: "/algorithms/searching/binary-search" },
            { text: "Depth-first search", link: "/algorithms/graphs/dfs" },
            { text: "Breadth-first search", link: "/algorithms/graphs/bfs" },
            { text: "Disjoint set union", link: "/algorithms/graphs/dsu" },
            { text: "Dijkstra's algorithm", link: "/algorithms/graphs/dijkstra" },
            { text: "0-1 BFS", link: "/algorithms/graphs/0-1-bfs" },
            { text: "Prefix sums", link: "/algorithms/arrays/prefix-sums" },
            { text: "Fenwick tree", link: "/algorithms/range-queries/fenwick-tree" },
            { text: "Segment tree", link: "/algorithms/range-queries/segment-tree" },
            { text: "Lowest common ancestor", link: "/algorithms/trees/lca" },
            {
                text: "Heavy-light decomposition",
                link: "/algorithms/trees/heavy-light-decomposition",
            },
            { text: "0/1 knapsack", link: "/algorithms/dynamic-programming/0-1-knapsack" },
        ],
    },
];

const aboutSidebar: DefaultTheme.SidebarItem[] = [
    {
        text: "About the project",
        collapsed: false,
        items: [
            { text: "About this encyclopedia", link: "/about" },
            { text: "Take it offline", link: "/download/" },
            { text: "Glossary", link: "/reference/glossary" },
        ],
    },
];

const sidebar: DefaultTheme.Config["sidebar"] = {
    "/about": aboutSidebar,
    "/download/": aboutSidebar,
    "/coverage/": [
        {
            text: "Coverage",
            collapsed: false,
            items: [{ text: "Coverage report", link: "/coverage/" }],
        },
    ],
    "/start/": [
        {
            text: "Prerequisite academy",
            collapsed: false,
            items: [
                { text: "How to use aayntn", link: "/start/" },
                { text: "From AP Computer Science A", link: "/start/from-ap-csa/" },
                {
                    text: "1 — Computational foundations",
                    link: "/start/from-ap-csa/part-1-computational-foundations",
                },
                {
                    text: "2 — Algorithm analysis",
                    link: "/start/from-ap-csa/part-2-algorithm-analysis",
                },
                {
                    text: "3 — Discrete mathematics",
                    link: "/start/from-ap-csa/part-3-discrete-mathematics",
                },
                {
                    text: "4 — Data structures and modeling",
                    link: "/start/from-ap-csa/part-4-data-structures-and-modeling",
                },
                {
                    text: "5 — Programming language transition",
                    link: "/start/from-ap-csa/part-5-language-transition",
                },
                {
                    text: "6 — Contest problem-solving literacy",
                    link: "/start/from-ap-csa/part-6-contest-literacy",
                },
            ],
        },
    ],
    "/curriculum/": [
        {
            text: "Bronze to Platinum",
            collapsed: false,
            items: [
                { text: "Curriculum overview", link: "/curriculum/" },
                { text: "Bronze", link: "/curriculum/bronze/" },
                { text: "Silver", link: "/curriculum/silver/" },
                { text: "Gold", link: "/curriculum/gold/" },
                { text: "Platinum", link: "/curriculum/platinum/" },
            ],
        },
    ],
    "/languages/": [
        {
            text: "Language centers",
            collapsed: false,
            items: [
                { text: "Compare the six languages", link: "/languages/" },
                { text: "C", link: "/languages/c/" },
                { text: "C++17", link: "/languages/cpp17/" },
                { text: "Java", link: "/languages/java/" },
                { text: "Python", link: "/languages/python/" },
                { text: "Pascal", link: "/languages/pascal/" },
                { text: "JavaScript", link: "/languages/javascript/" },
            ],
        },
    ],
    "/templates/": [
        {
            text: "Template library",
            collapsed: false,
            items: [
                { text: "How to use the templates", link: "/templates/" },
                { text: "C", link: "/templates/#c" },
                { text: "C++17", link: "/templates/#cpp17" },
                { text: "Java", link: "/templates/#java" },
                { text: "Python", link: "/templates/#python" },
                { text: "Pascal", link: "/templates/#pascal" },
                { text: "JavaScript", link: "/templates/#javascript" },
            ],
        },
    ],
    "/mathematics/": [
        {
            text: "Mathematics",
            collapsed: false,
            items: [{ text: "Overview", link: "/mathematics/" }],
        },
    ],
    "/practice/": [
        {
            text: "Practice",
            collapsed: false,
            items: [
                { text: "Problem catalog", link: "/practice/" },
                { text: "Contest simulation", link: "/contest/" },
                { text: "The debugging laboratory", link: "/debugging/" },
            ],
        },
    ],
    "/contest/": [
        {
            text: "Contest",
            collapsed: false,
            items: [{ text: "Contest simulation", link: "/contest/" }],
        },
    ],
    "/debugging/": [
        {
            text: "Debugging",
            collapsed: false,
            items: [{ text: "The debugging laboratory", link: "/debugging/" }],
        },
    ],
    "/laboratory/": [
        {
            text: "Laboratory",
            collapsed: false,
            items: [{ text: "Interactive algorithms", link: "/laboratory/" }],
        },
    ],
    "/progress/": [
        {
            text: "My progress",
            collapsed: false,
            items: [{ text: "Dashboard", link: "/progress/" }],
        },
    ],
    "/reference/": [
        {
            text: "Reference",
            collapsed: false,
            items: [
                { text: "Overview", link: "/reference/" },
                { text: "USACO rules and eligibility", link: "/reference/usaco-rules" },
                { text: "Pre-contest checklist", link: "/reference/contest-checklist" },
                { text: "Glossary", link: "/reference/glossary" },
            ],
        },
    ],
    "/algorithms/": algorithmsSidebar,
};

/* ------------------------------------------------------------------ */
/* Site configuration                                                  */
/* ------------------------------------------------------------------ */

/**
 * The path under which the site is published, and the address of the site.
 *
 * Neither is written here. A publication under a path — a project site on
 * GitHub Pages, for instance — passes the path in `AAYNTN_BASE`, and the
 * address that the sitemap names is passed in `AAYNTN_HOSTNAME`. A build
 * without either of them is a build for the root of a domain, and it writes
 * no sitemap, because a sitemap that names the wrong host is worse than no
 * sitemap at all.
 */
const BASE = process.env["AAYNTN_BASE"] ?? "/";
const HOSTNAME = process.env["AAYNTN_HOSTNAME"] ?? "";

/**
 * The documents that every page carries in its head.
 *
 * The typefaces are named by the base because the page is served under it.
 */
const HEAD: [string, Record<string, string>][] = [
    ["link", { rel: "stylesheet", href: `${BASE}fonts/fonts.css` }],
    [
        "link",
        {
            rel: "preload",
            href: `${BASE}fonts/noto-sans-latin.woff2`,
            as: "font",
            type: "font/woff2",
            crossorigin: "anonymous",
        },
    ],
    [
        "link",
        {
            rel: "preload",
            href: `${BASE}fonts/noto-sans-mono-latin.woff2`,
            as: "font",
            type: "font/woff2",
            crossorigin: "anonymous",
        },
    ],
    ["meta", { name: "theme-color", content: "#2847b8" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "A.A.Y.N.T.N." }],
    [
        "meta",
        {
            name: "description",
            content:
                "A complete competitive programming encyclopedia: mathematical derivations, six-language implementations, and deterministic animated algorithms.",
        },
    ],
];

if (HOSTNAME) HEAD.push(["link", { rel: "sitemap", href: `${BASE}sitemap.xml` }]);

export default defineConfig({
    title: "A.A.Y.N.T.N.",
    titleTemplate: ":title — A.A.Y.N.T.N.",
    description:
        "A.A.Y.N.T.N. is All Algorithms You Need to Know — a complete, mathematically rigorous competitive programming encyclopedia from AP Computer Science A through USACO Platinum and beyond.",
    lang: "en-US",
    cleanUrls: true,
    /*
     * Every address that the site writes — the assets, the links, the
     * listings that a reader opens, the search index and the service worker
     * — starts from this base, so a publication under a path works without a
     * second pass over the sources.
     */
    base: BASE,
    lastUpdated: true,
    ignoreDeadLinks: false,
    metaChunk: true,

    head: HEAD,

    transformHead({ pageData }) {
        if (!HOSTNAME) return [];
        const title = (pageData.frontmatter["title"] as string | undefined) ?? "A.A.Y.N.T.N.";
        const description =
            (pageData.frontmatter["summary"] as string | undefined) ??
            "A complete competitive programming encyclopedia with derivations, six-language implementations and deterministic animations.";
        const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
        const url = `${HOSTNAME.replace(/\/+$/, "")}${BASE}${path}`;
        const publicDir = fileURLToPath(new URL("../public", import.meta.url));
        const slug = pageData.relativePath.replace(/\.md$/, "").replace(/\//g, "-");
        const card = existsSync(`${publicDir}/og/${slug}.png`)
            ? `og/${slug}.png`
            : existsSync(`${publicDir}/og-default.png`)
              ? "og-default.png"
              : null;
        const head: [string, Record<string, string>][] = [
            ["meta", { property: "og:title", content: title }],
            ["meta", { property: "og:description", content: description }],
            ["meta", { property: "og:url", content: url }],
            ["meta", { name: "twitter:card", content: card ? "summary_large_image" : "summary" }],
        ];
        if (card) {
            head.push([
                "meta",
                {
                    property: "og:image",
                    content: `${HOSTNAME.replace(/\/+$/, "")}${BASE}${card}`,
                },
            ]);
        }
        return head;
    },

    /* A sitemap is written only when the address of the site is known. */
    ...(HOSTNAME
        ? {
              sitemap: {
                  hostname: HOSTNAME,
                  transformItems(items: { url: string }[]) {
                      const prefix = BASE.replace(/\/+$/, "");
                      return items
                          .filter((item) => !item.url.includes("implementations/"))
                          .map((item) => ({ ...item, url: `${prefix}/${item.url}` }));
                  },
              },
          }
        : {}),

    markdown: {
        // KaTeX is the only mathematics renderer; MathJax must stay off.
        math: false,
        lineNumbers: false,
        // The outline of a page is built from the headings that the Markdown
        // carries, so that the two can never disagree.
        headers: true,
        config(md) {
            md.use(mathPanel);
            md.use(katex as never, {
                delimiters: "dollars",
                throwOnError: false,
                errorColor: "#C63D32",
                strict: false,
                trust: false,
                macros: katexMacros,
            });

            /*
             * An address written in Markdown is rewritten by the site, but an
             * address written in a raw HTML block — a definition list, a
             * figure, a table — is not. This pass puts the base in front of
             * every address that the page would otherwise ask for at the root
             * of the domain.
             */
            const render = md.renderer.render.bind(md.renderer);
            md.renderer.render = (tokens, options, env) => {
                const html = render(tokens, options, env);
                if (BASE === "/") return html;
                return html.replace(
                    /(href|src)="(\/[^"]*)"/g,
                    (whole: string, attribute: string, value: string) => {
                        if (value.startsWith("//")) return whole;
                        if (value.startsWith(BASE)) return whole;
                        return `${attribute}="${BASE}${value.slice(1)}"`;
                    },
                );
            };
        },
        theme: {
            light: aayntnLight,
            dark: aayntnDark,
        },
        // The bundled language identifiers are accepted as plain strings at run time;
        // the published type only describes a language registration object.
        languages: [
            "c",
            "cpp",
            "java",
            "python",
            "pascal",
            "javascript",
            "json",
            "yaml",
            "bash",
            "powershell",
            "text",
            "diff",
        ] as unknown as LanguageInput[],
    },

    themeConfig: {
        nav,
        sidebar,
        outline: { level: [2, 3], label: "On this page" },
        docFooter: { prev: "Previous", next: "Next" },
        darkModeSwitchLabel: "Appearance",
        lightModeSwitchTitle: "Switch to light theme",
        darkModeSwitchTitle: "Switch to dark theme",
        sidebarMenuLabel: "Menu",
        returnToTopLabel: "Back to top",
        externalLinkIcon: true,
        socialLinks: [{ icon: "github", link: REPOSITORY_URL }],
        footer: {
            message:
                "A.A.Y.N.T.N. is an independent preparation resource. It is not affiliated with, endorsed by, sponsored by, or supported by the United States of America Computing Olympiad, by the College Board, or by any school. The examination, competition and language names belong to their owners.",
            copyright:
                "Licensed under AGPL-3.0-only. Original lessons, implementations and artwork. The webfonts are Noto Sans and Noto Sans Mono under the SIL Open Font License 1.1.",
        },
        editLink: {
            pattern: `${REPOSITORY_URL}/edit/main/docs/:path`,
            text: "Suggest an improvement to this page",
        },
    },

    vite: {
        build: {
            /*
             * A single mathematics-heavy article carries every formula as
             * server-rendered KaTeX in its own content chunk. That chunk is
             * intentionally large and compresses well; the lean chunk that a
             * reader downloads first stays small. The threshold records that
             * budget instead of warning about the encyclopedia's own prose.
             */
            chunkSizeWarningLimit: 900,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (
                            id.includes(
                                "docs/.vitepress/theme/laboratories/core/AlgorithmPlayer.vue",
                            )
                        ) {
                            return "laboratory";
                        }
                        /*
                         * VitePress reexports Content through its client entry,
                         * while Content imports that entry. Keeping both in one
                         * chunk removes the cross-chunk cycle Rollup warns
                         * about.
                         */
                        if (
                            id.includes("vitepress/dist/client/index") ||
                            id.includes("vitepress/dist/client/app/components/Content")
                        ) {
                            return "vitepress";
                        }
                        if (id.includes("node_modules/.pnpm/vitepress@")) return "vitepress";
                        if (
                            id.includes("node_modules/.pnpm/vue@") ||
                            id.includes("node_modules/.pnpm/@vue+") ||
                            id.includes("node_modules/.pnpm/vue-router@")
                        ) {
                            return "vue";
                        }
                        if (id.includes("node_modules/.pnpm/minisearch@")) return "search";
                        return undefined;
                    },
                },
            },
        },
        css: {
            preprocessorOptions: {},
        },
    },
});
