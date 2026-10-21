/**
 * Normalize the internal links.
 *
 * With clean URLs, a page that lives at `docs/a/b.md` is addressed as
 * `/a/b`, and a page that lives at `docs/a/b/index.md` is addressed as
 * `/a/b/`. A trailing slash on the first kind is a dead link, and a missing
 * trailing slash on the second kind is a dead link too, so the compiler
 * reports both without saying which file the mistake is in.
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

    // A link that carries a trailing slash: keep it when the target is a
    // directory index, and drop it when the target is a flat page.
    updated = updated.replace(/\]\((\/[^)\s#]*?)\/(\)|#|\s|"|')/g, (match, path, suffix) => {
        if (existsSync(join(DOCS_DIR, path, "index.md"))) return match;
        if (existsSync(join(DOCS_DIR, `${path}.md`))) return `](${path}${suffix})`;
        return match;
    });

    // A link that carries no trailing slash: give it one when the target is
    // a directory index.
    updated = updated.replace(/\]\((\/[^)\s#]*?)\)/g, (match, path) => {
        if (path.endsWith("/")) return match;
        if (existsSync(join(DOCS_DIR, path, "index.md"))) return `](${path}/)`;
        return match;
    });

    if (updated !== source) {
        await writeFile(file, updated, "utf8");
        changed += 1;
        process.stdout.write(`rewrote ${relative}\n`);
    }
}

process.stdout.write(`${changed} file(s) rewritten\n`);
