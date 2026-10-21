/**
 * Normalize the internal links.
 *
 * With clean URLs, a page that lives at `docs/a/b.md` is addressed as
 * `/a/b`, and a page that lives at `docs/a/b/index.md` is addressed as
 * `/a/b/`. A trailing slash on the first kind is a dead link, and the
 * compiler reports it without saying which file the mistake is in.
 *
 * This tool rewrites the links in place, and reports what it changed.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import { DOCS_DIR, ROOT, rel } from "./lib/paths.ts";

const files = await fg("**/*.md", { cwd: DOCS_DIR, absolute: true, onlyFiles: true });

let changed = 0;

for (const file of files) {
    const relative = rel(ROOT, file);
    if (relative.includes("/docs/implementations/")) continue;

    const source = await readFile(file, "utf8");
    let updated = source;

    updated = updated.replace(/\]\((\/[^)\s#]*?)\/(\)|#|\s|"|')/g, (match, path, suffix) => {
        // A directory index keeps its trailing slash; a flat page loses it.
        if (existsSync(join(DOCS_DIR, path, "index.md"))) return match;
        if (existsSync(join(DOCS_DIR, `${path}.md`))) return `](${path}${suffix}`;
        return match;
    });

    if (updated !== source) {
        await writeFile(file, updated, "utf8");
        changed += 1;
        process.stdout.write(`rewrote ${relative}\n`);
    }
}

process.stdout.write(`${changed} file(s) rewritten\n`);
