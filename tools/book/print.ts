/**
 * Print the generated book to PDF.
 *
 * A throwaway server serves `docs/public` only, and the browser opens
 * `/book/`. The site itself is never loaded, so a stale page in the
 * development server cannot leak into the PDF.
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { chromium } from "@playwright/test";
import { PUBLIC_DIR, ROOT } from "../lib/paths.ts";

interface Preset {
    file: string;
    label: string;
    languages: string[];
}

const PRESETS: Preset[] = [
    { file: "aayntn-book-cpp17.pdf", label: "C++17", languages: ["cpp17"] },
    { file: "aayntn-book-cpp17-java.pdf", label: "C++17 and Java", languages: ["cpp17", "java"] },
    {
        file: "aayntn-book-cpp17-python.pdf",
        label: "C++17 and Python",
        languages: ["cpp17", "python"],
    },
    {
        file: "aayntn-book-c-cpp17-java.pdf",
        label: "C, C++17 and Java",
        languages: ["c", "cpp17", "java"],
    },
    {
        file: "aayntn-book-all.pdf",
        label: "All six languages",
        languages: ["c", "cpp17", "java", "python", "pascal", "javascript"],
    },
];

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
};

function contentType(file: string): string {
    return MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
}

function startServer(): Promise<{ origin: string; close: () => Promise<void> }> {
    const root = resolve(PUBLIC_DIR);
    const server = createServer(async (request, response) => {
        try {
            const url = new URL(request.url ?? "/", "http://127.0.0.1");
            let pathname: string;
            try {
                pathname = decodeURIComponent(url.pathname);
            } catch {
                response.writeHead(400).end("bad request");
                return;
            }

            let file = join(root, normalize(pathname).split("/").join(sep));
            if (!file.startsWith(root + sep) && file !== root) {
                response.writeHead(403).end("forbidden");
                return;
            }

            let info = await stat(file);
            if (info.isDirectory()) {
                file = join(file, "index.html");
                info = await stat(file);
            }

            if (!info.isFile()) {
                response.writeHead(404).end("not found");
                return;
            }

            const body = await readFile(file);
            response.writeHead(200, {
                "content-type": contentType(file),
                "content-length": body.byteLength,
                "cache-control": "no-store",
            });
            response.end(body);
        } catch {
            response.writeHead(404).end("not found");
        }
    });

    return new Promise((resolvePromise, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("the print server did not receive a port"));
                return;
            }
            resolvePromise({
                origin: `http://127.0.0.1:${address.port}`,
                close: () =>
                    new Promise<void>((done, fail) =>
                        server.close((error) => (error ? fail(error) : done())),
                    ),
            });
        });
    });
}

function headerTemplate(preset: Preset): string {
    return `<div style="width:100%; box-sizing:border-box; padding:0 16mm; display:flex; justify-content:space-between; font-family:Arial, sans-serif; font-size:8px; color:#414957;">
<span>All Algorithms You Need to Know</span>
<span>${preset.label}</span>
</div>`;
}

function footerTemplate(): string {
    return `<div style="width:100%; box-sizing:border-box; padding:0 16mm; text-align:center; font-family:Arial, sans-serif; font-size:8px; color:#414957;">
<span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;
}

async function main(): Promise<void> {
    const book = join(PUBLIC_DIR, "book", "index.html");
    try {
        await stat(book);
    } catch {
        throw new Error("docs/public/book/index.html is missing; run tools/book/build.ts first");
    }

    const outputDirectory = join(ROOT, "dist-book");
    await mkdir(outputDirectory, { recursive: true });

    const server = await startServer();
    const browser = await chromium.launch();

    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
        const url = new URL("/book/", server.origin);

        for (const preset of PRESETS) {
            url.search = new URLSearchParams({ languages: preset.languages.join(",") }).toString();
            await page.goto(url.href, { waitUntil: "load" });
            await page.emulateMedia({ media: "print" });
            await page.evaluate(() => document.fonts.ready);
            await page.waitForFunction(
                () => document.documentElement.dataset["languages"] !== undefined,
            );

            const path = join(outputDirectory, preset.file);
            await page.pdf({
                path,
                format: "A4",
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: headerTemplate(preset),
                footerTemplate: footerTemplate(),
                outline: true,
                tagged: true,
                margin: {
                    top: "18mm",
                    bottom: "20mm",
                    left: "16mm",
                    right: "16mm",
                },
            });
            process.stdout.write(`pdf: ${path}\n`);
        }
    } finally {
        await browser.close();
        await server.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
