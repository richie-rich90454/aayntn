import { defineConfig } from "vitepress";
import { katex } from "@mdit/plugin-katex";
import type { DefaultTheme } from "vitepress";
import type { LanguageInput } from "shiki";
import { aayntnDark, aayntnLight } from "./theme/shiki-theme";
import { katexMacros } from "./theme/katex-macros";

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

const nav: DefaultTheme.Config["nav"] = [
    { text: "Start here", link: "/start/", activeMatch: "/start/" },
    { text: "Curriculum", link: "/curriculum/", activeMatch: "/curriculum/" },
    { text: "Algorithms", link: "/algorithms/", activeMatch: "/algorithms/" },
    { text: "Practice", link: "/practice/", activeMatch: "/practice/" },
    { text: "Contest", link: "/contest/", activeMatch: "/contest/" },
    { text: "Debugging", link: "/debugging/", activeMatch: "/debugging/" },
    { text: "Laboratory", link: "/laboratory/", activeMatch: "/laboratory/" },
    { text: "Languages", link: "/languages/", activeMatch: "/languages/" },
    { text: "Templates", link: "/templates/", activeMatch: "/templates/" },
    { text: "Mathematics", link: "/mathematics/", activeMatch: "/mathematics/" },
    { text: "My progress", link: "/progress/", activeMatch: "/progress/" },
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

const sidebar: DefaultTheme.Config["sidebar"] = {
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

export default defineConfig({
    title: "A.A.Y.N.T.N.",
    titleTemplate: ":title — A.A.Y.N.T.N.",
    description:
        "A.A.Y.N.T.N. is All Algorithms You Need to Know — a complete, mathematically rigorous competitive programming encyclopedia from AP Computer Science A through USACO Platinum and beyond.",
    lang: "en-US",
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: false,
    metaChunk: true,

    head: [
        ["link", { rel: "stylesheet", href: "/fonts/fonts.css" }],
        [
            "link",
            {
                rel: "preload",
                href: "/fonts/noto-sans-latin.woff2",
                as: "font",
                type: "font/woff2",
                crossorigin: "anonymous",
            },
        ],
        [
            "link",
            {
                rel: "preload",
                href: "/fonts/noto-sans-mono-latin.woff2",
                as: "font",
                type: "font/woff2",
                crossorigin: "anonymous",
            },
        ],
        ["meta", { name: "theme-color", content: "#2847b8" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:site_name", content: "aayntn" }],
        [
            "meta",
            {
                name: "description",
                content:
                    "A complete competitive programming encyclopedia: mathematical derivations, six-language implementations, and deterministic animated algorithms.",
            },
        ],
        ["link", { rel: "sitemap", href: "/sitemap.xml" }],
    ],

    sitemap: {
        hostname: "https://aayntn.org",
        transformItems(items) {
            return items.filter((item) => !item.url.includes("/implementations/"));
        },
    },

    markdown: {
        // KaTeX is the only mathematics renderer; MathJax must stay off.
        math: false,
        lineNumbers: false,
        config(md) {
            md.use(katex as never, {
                delimiters: "dollars",
                throwOnError: false,
                errorColor: "#C63D32",
                strict: false,
                trust: false,
                macros: katexMacros,
            });
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
        socialLinks: [{ icon: "github", link: "https://github.com/aayntn/atlas" }],
        footer: {
            message:
                "aayntn is an independent preparation resource. It is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad.",
            copyright:
                "Licensed under AGPL-3.0-only. Original lessons, implementations and artwork.",
        },
        editLink: {
            pattern: "https://github.com/aayntn/atlas/edit/main/docs/:path",
            text: "Suggest an improvement to this page",
        },
    },

    vite: {
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        laboratory: ["docs/.vitepress/theme/laboratories/core/AlgorithmPlayer.vue"],
                    },
                },
            },
        },
        css: {
            preprocessorOptions: {},
        },
    },
});
