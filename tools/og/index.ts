/**
 * Render the share cards.
 *
 * Every page that a crawler can reach gets a 1200 by 630 card carrying its own
 * title, so a link posted anywhere shows the page rather than the site name.
 * The cards are build output: they are rendered on the deployment, not
 * committed, because a card that falls out of date with its page is worse than
 * no card at all.
 *
 * Usage: `pnpm run og` after `pnpm run generate`.
 */
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import lessons from "../../docs/.vitepress/data/generated/lessons.json";

const OUT = "docs/public/og";
const FONT = "docs/public/fonts/noto-sans-latin.woff2";

interface Lesson {
    id: string;
    title: string;
    summary: string;
    href: string;
}

function slug(lesson: Lesson): string {
    const clean = lesson.href.replace(/^\/|\/$/g, "");
    if (clean === "") return "index";
    return (lesson.href.endsWith("/") ? `${clean}/index` : clean).replace(/\//g, "-");
}

function card(title: string, summary: string, footer: string, font: string): string {
    return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8" />
<style>
    @font-face {
        font-family: "Noto Sans";
        src: url(data:font/woff2;base64,${font}) format("woff2");
        font-weight: 100 900;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1200px; height: 630px; }
    body {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 64px 72px 56px;
        background: #f7f8fc;
        color: #161616;
        font-family: "Noto Sans";
    }
    .top { display: flex; align-items: baseline; gap: 20px; }
    .brand { color: #2847b8; font-size: 26px; font-weight: 700; letter-spacing: 0.14em; }
    .tagline { color: #646d7c; font-size: 19px; }
    .rule { margin-top: 18px; height: 3px; background: #e8b84a; }
    h1 {
        margin: 40px 0 0;
        max-width: 1000px;
        font-size: 64px;
        line-height: 1.08;
        letter-spacing: -0.022em;
        font-weight: 700;
    }
    p {
        margin: 26px 0 0;
        max-width: 980px;
        color: #414957;
        font-size: 25px;
        line-height: 1.42;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
    .footer { color: #646d7c; font-size: 20px; }
    .strip { width: 1200px; height: 12px; margin: 0 -72px -56px; background: #2847b8; }
</style>
</head>
<body>
    <div>
        <div class="top">
            <span class="brand">A.A.Y.N.T.N.</span>
            <span class="tagline">All Algorithms You Need to Know</span>
        </div>
        <div class="rule"></div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(summary)}</p>
    </div>
    <div class="bottom">
        <span class="footer">${escapeHtml(footer)}</span>
        <span class="footer">richie-rich90454.github.io/aayntn</span>
    </div>
    <div class="strip"></div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

async function main(): Promise<void> {
    await mkdir(OUT, { recursive: true });
    const font = (await readFile(FONT)).toString("base64");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    const list = lessons as Lesson[];

    await page.setContent(
        card(
            "All algorithms you need to know",
            "From AP Computer Science A to USACO Platinum: derivations, six-language implementations and deterministic animations.",
            "A complete competitive programming encyclopedia",
            font,
        ),
        { waitUntil: "load" },
    );
    await page.screenshot({ path: join(OUT, "..", "og-default.png") });

    for (const lesson of list) {
        const footer =
            lesson.href.split("/").filter(Boolean).slice(0, -1).join(" / ") || "A.A.Y.N.T.N.";
        await page.setContent(card(lesson.title, lesson.summary, footer, font), {
            waitUntil: "load",
        });
        await page.screenshot({ path: join(OUT, `${slug(lesson)}.png`) });
    }

    await browser.close();
    process.stdout.write(`${list.length + 1} share cards\n`);
}

await main();
