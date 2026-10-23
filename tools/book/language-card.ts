/**
 * Print the two-page language card.
 *
 * The card contains only the six starting programs from
 * `docs/templates/index.md`: C, C++17, Java, Python, Pascal and JavaScript.
 * Each one shows the language syntax, the input read and the output write.
 */
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { DOCS_DIR, ROOT } from "../lib/paths.ts";
import { createBookMarkdown, escapeHtml, highlightCode } from "./render.ts";

interface Template {
    heading: string;
    language: string;
    code: string;
}

const CARD_HEADINGS = [
    "C",
    "C++17, convenience form",
    "Java, with the fast scanner",
    "Python",
    "Pascal",
    "JavaScript",
] as const;

function extractTemplates(
    md: Awaited<ReturnType<typeof createBookMarkdown>>["md"],
    source: string,
): Map<string, Template> {
    const tokens = md.parse(source, {});
    const templates = new Map<string, Template>();
    let heading = "";

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index]!;
        if (token.type === "heading_open" && token.tag === "h3") {
            const inline = tokens[index + 1];
            heading = inline && inline.type === "inline" ? inline.content.trim() : "";
            continue;
        }
        if (token.type !== "fence" || !heading) continue;
        if (!templates.has(heading) && (CARD_HEADINGS as readonly string[]).includes(heading)) {
            templates.set(heading, {
                heading,
                language: token.info.trim().split(/\s+/)[0] ?? "text",
                code: token.content.replace(/\s+$/, ""),
            });
        }
    }

    return templates;
}

function cardItem(
    template: Template,
    highlighter: Awaited<ReturnType<typeof createBookMarkdown>>["highlighter"],
): string {
    return `<article class="card-item">
<h2>${escapeHtml(template.heading)}</h2>
${highlightCode(highlighter, template.code, template.language)}
</article>`;
}

function pageHtml(
    number: number,
    total: number,
    templates: Template[],
    highlighter: Awaited<ReturnType<typeof createBookMarkdown>>["highlighter"],
): string {
    const columns = [templates.slice(0, 2), templates.slice(2)];
    return `<section class="card-page">
<header class="card-page__head">
<div>
<p class="card-page__mark">A.A.Y.N.T.N.</p>
<h1>Language card — permitted contest reference</h1>
</div>
<p class="card-page__note">Each program reads a count, reads that many integers, and prints their sum.</p>
</header>
<div class="card-page__columns">
${columns
    .map(
        (column) => `<div class="card-page__column">
${column.map((template) => cardItem(template, highlighter)).join("\n")}
</div>`,
    )
    .join("\n")}
</div>
<footer class="card-page__foot">
<span>Permitted during an active contest for language syntax and standard input and output. Algorithm resources and pre-written templates may not be consulted.</span>
<span>Page ${number} of ${total}</span>
</footer>
</section>`;
}

const CARD_CSS = `
@page { size: A4; margin: 10mm; }
html { color-scheme: light; }
body {
    margin: 0;
    background: #ffffff;
    color: #161616;
    font-family: "Noto Sans", "Segoe UI", system-ui, sans-serif;
}
.card-page {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 277mm;
    padding: 0;
}
.card-page + .card-page { break-before: page; }
.card-page__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8mm;
    padding-bottom: 2mm;
    border-bottom: 2px solid #161616;
}
.card-page__mark {
    margin: 0 0 1mm;
    color: #2847b8;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.22em;
}
.card-page__head h1 {
    margin: 0;
    font-size: 12.5pt;
    line-height: 1.2;
}
.card-page__note {
    margin: 0;
    max-width: 72mm;
    color: #414957;
    font-size: 7pt;
    line-height: 1.35;
    text-align: right;
}
.card-page__columns {
    display: flex;
    flex: 1;
    align-items: flex-start;
    gap: 5mm;
    padding: 4mm 0;
}
.card-page__column {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 4mm;
}
.card-item { break-inside: avoid; }
.card-item h2 {
    margin: 0 0 1mm;
    padding-bottom: 0.8mm;
    border-bottom: 1px solid #767e8d;
    font-size: 9pt;
    letter-spacing: 0.02em;
}
.card-item pre {
    margin: 0;
    padding: 2mm;
    border: 1px solid #b6bcc8;
    background: #ffffff !important;
    font-family: "Noto Sans Mono", "Cascadia Mono", monospace;
    font-size: 5.5pt;
    line-height: 1.28;
    tab-size: 4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    break-inside: avoid;
}
.card-item pre code {
    font-family: inherit;
    font-size: inherit;
}
.card-page__foot {
    display: flex;
    justify-content: space-between;
    gap: 8mm;
    padding-top: 1.5mm;
    border-top: 1px solid #767e8d;
    color: #414957;
    font-size: 6.5pt;
    line-height: 1.3;
}
.card-page__foot span:first-child { max-width: 150mm; }
`;

async function main(): Promise<void> {
    const { md, highlighter } = await createBookMarkdown();
    const source = await readFile(join(DOCS_DIR, "templates", "index.md"), "utf8");
    const templates = extractTemplates(md, source);

    const missing = CARD_HEADINGS.filter((heading) => !templates.has(heading));
    if (missing.length) {
        throw new Error(`the template page is missing: ${missing.join(", ")}`);
    }

    const ordered = CARD_HEADINGS.map((heading) => templates.get(heading)!);
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Language card — permitted contest reference</title>
<style>${CARD_CSS}</style>
</head>
<body>
${pageHtml(1, 2, ordered.slice(0, 3), highlighter)}
${pageHtml(2, 2, ordered.slice(3), highlighter)}
</body>
</html>`;

    const outputDirectory = join(ROOT, "dist-book");
    await mkdir(outputDirectory, { recursive: true });
    const path = join(outputDirectory, "aayntn-language-card.pdf");

    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
        await page.setContent(html, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.pdf({
            path,
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });
        process.stdout.write(`pdf: ${path}\n`);
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
