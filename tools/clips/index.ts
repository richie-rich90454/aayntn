/**
 * Record the twelve demonstrations.
 *
 * The clips are for the places where a running site cannot go: the README, a
 * release note, a slide. Each one is a real recording of the laboratory, so it
 * cannot show an operation the player does not perform.
 *
 * Usage: `pnpm run clips` after a build. The preview server is started here
 * and stopped here, so nothing is left listening.
 */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import visualizations from "../../docs/.vitepress/data/generated/visualizations.json";

const PORT = 4330;
const URL = `http://127.0.0.1:${PORT}`;
const CLIPS = "docs/public/clips";
const WORK = join(CLIPS, ".work");
const BASE = process.env["AAYNTN_BASE"] ?? "/";

interface Visualization {
    id: string;
    title: string;
    href: string;
}

async function ready(): Promise<void> {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(`${URL}${BASE}`);
            if (response.ok) return;
        } catch {
            // The server is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`the preview server did not answer at ${URL}${BASE}`);
}

async function main(): Promise<void> {
    await rm(CLIPS, { recursive: true, force: true });
    await mkdir(WORK, { recursive: true });

    const server = spawn(
        "pnpm",
        ["exec", "vitepress", "preview", "docs", "--port", String(PORT), "--host", "127.0.0.1"],
        { shell: true, stdio: "ignore" },
    );

    try {
        await ready();
        const browser = await chromium.launch();
        const labs = visualizations as Visualization[];
        const index: { id: string; title: string; src: string; href: string }[] = [];

        for (const lab of labs) {
            const context = await browser.newContext({
                viewport: { width: 960, height: 720 },
                recordVideo: { dir: WORK, size: { width: 960, height: 720 } },
            });
            const page = await context.newPage();
            await page.goto(`${URL}${BASE}laboratory/#${lab.id}`, { waitUntil: "networkidle" });

            const player = page.locator(`h3[id="${lab.id}"] + p + section.aayntn-lab`);
            await player.waitFor({ timeout: 30_000 });
            await player.scrollIntoViewIfNeeded();

            const play = player.locator(".aayntn-transport__button--primary").first();
            if ((await play.count()) > 0) await play.click();
            await page.waitForTimeout(7000);

            const video = page.video();
            await context.close();
            if (!video) throw new Error(`no recording was produced for ${lab.id}`);
            await rename(await video.path(), join(CLIPS, `${lab.id}.webm`));
            index.push({
                id: lab.id,
                title: lab.title,
                src: `/clips/${lab.id}.webm`,
                href: lab.href,
            });
            process.stdout.write(`clip: ${lab.id}\n`);
        }

        await browser.close();
        await writeFile("data/clips.json", JSON.stringify(index, null, 4) + "\n", "utf8");
        process.stdout.write(`${index.length} clips\n`);
    } finally {
        await rm(WORK, { recursive: true, force: true });
        server.kill();
    }
}

await main();
