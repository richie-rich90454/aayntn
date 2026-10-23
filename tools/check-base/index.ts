/**
 * Check that every address in the built site resolves to a file in it.
 *
 * A site that is published under a path — a project site on GitHub Pages,
 * for instance — breaks in a way that a local build cannot show: the page
 * loads, and every asset it asks for is answered with the page of another
 * site, or with nothing at all. The check reads the built files, resolves
 * every address the way a browser would, and names the ones that would be
 * asked for outside the site.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";

const DIST = "docs/.vitepress/dist";
const BASE = process.env["AAYNTN_BASE"] ?? "/";

/** The attributes that carry an address a browser will fetch. */
const ATTRIBUTES = ["href", "src", "poster", "action"];

interface Problem {
    file: string;
    attribute: string;
    address: string;
    reason: string;
}

const problems: Problem[] = [];

/**
 * Resolve an address against the built site, the way a server would.
 *
 * Returns the file that the address names, or nothing when the address
 * leaves the site.
 */
function resolveAddress(address: string): string | null {
    // An address that leaves the site, or that the browser does not fetch.
    if (!address.startsWith("/")) return null;
    if (address.startsWith("//")) return null;
    if (address.startsWith("/#")) return null;

    const withoutHash = address.split("#")[0]!;
    const withoutQuery = withoutHash.split("?")[0]!;
    if (withoutQuery === "") return null;

    if (!withoutQuery.startsWith(BASE)) return null;
    const relative = withoutQuery.slice(BASE.length);
    if (relative === "") return join(DIST, "index.html");

    const candidates = [
        join(DIST, relative),
        join(DIST, `${relative}.html`),
        join(DIST, relative, "index.html"),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate)) return candidate;
    }
    return null;
}

/** Whether the address is meant to live inside this site at all. */
function isInternal(address: string): boolean {
    if (!address.startsWith("/")) return false;
    if (address.startsWith("//")) return false;
    return true;
}

const pages = await fg("**/*.html", { cwd: DIST, absolute: true });
const sheets = await fg("**/*.css", { cwd: DIST, absolute: true });

for (const file of pages) {
    const source = await readFile(file, "utf8");

    for (const attribute of ATTRIBUTES) {
        const pattern = new RegExp(`${attribute}="([^"]*)"`, "g");
        for (const match of source.matchAll(pattern)) {
            const address = match[1]!.trim();
            if (!isInternal(address)) continue;

            const withoutHash = address.split("#")[0]!;
            // An address that is only a fragment of the same page.
            if (withoutHash === "") continue;

            if (!withoutHash.startsWith(BASE) && withoutHash !== BASE.slice(0, -1)) {
                problems.push({
                    file,
                    attribute,
                    address,
                    reason: `it does not carry the base ${BASE}`,
                });
                continue;
            }

            if (!resolveAddress(address)) {
                problems.push({
                    file,
                    attribute,
                    address,
                    reason: "no such file in the built site",
                });
            }
        }
    }
}

for (const file of sheets) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/url\(\s*["']?(\/[^"')]*)/g)) {
        const address = match[1]!;
        if (!address.startsWith(BASE)) {
            problems.push({
                file,
                attribute: "url()",
                address,
                reason: `it does not carry the base ${BASE}`,
            });
            continue;
        }
        if (!resolveAddress(address)) {
            problems.push({
                file,
                attribute: "url()",
                address,
                reason: "no such file in the built site",
            });
        }
    }
}

const relative = (file: string) =>
    file.replace(/\\/g, "/").replace(`${process.cwd().replace(/\\/g, "/")}/`, "");

/*
 * The addresses that the browser asks for after the page has loaded. They are
 * written by a module rather than by the markup, so the bundler inlines them
 * as string literals and they are checked here by name.
 */
const RUNTIME_ADDRESSES = [`${BASE}search-index.json`, `${BASE}implementations/`];
const scripts = await fg("**/*.js", { cwd: DIST, absolute: true });

for (const address of RUNTIME_ADDRESSES) {
    let found = false;
    for (const file of scripts) {
        if ((await readFile(file, "utf8")).includes(address)) {
            found = true;
            break;
        }
    }
    if (found) continue;
    problems.push({
        file: DIST,
        attribute: "runtime",
        address,
        reason: "no built module asks for it under the base",
    });
}

process.stdout.write(`base: ${BASE}\n`);
process.stdout.write(`checked ${pages.length} page(s) and ${sheets.length} style sheet(s)\n`);

if (problems.length === 0) {
    process.stdout.write("every internal address carries the base and resolves\n");
    process.exit(0);
}

process.stdout.write(`${problems.length} address(es) fail\n`);
const grouped = new Map<string, { count: number; reason: string }>();
for (const problem of problems) {
    const key = `${relative(problem.file)}  ${problem.attribute}="${problem.address}"`;
    const entry = grouped.get(key);
    if (entry) entry.count += 1;
    else grouped.set(key, { count: 1, reason: problem.reason });
}

let printed = 0;
for (const [key, entry] of grouped) {
    if (printed >= 25) break;
    process.stdout.write(
        `  ${key}  — ${entry.reason}${entry.count > 1 ? ` (x${entry.count})` : ""}\n`,
    );
    printed += 1;
}
if (grouped.size > printed) process.stdout.write(`  ... and ${grouped.size - printed} more\n`);

process.exit(1);
