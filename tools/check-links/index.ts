/**
 * Check that every internal link resolves.
 *
 * VitePress already refuses to build a page that links to a missing page, but
 * it does not look at the links inside a fenced code block, inside a
 * component, or at the references that the metadata carries. This tool closes
 * that gap.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { DOCS_DIR, ROOT, rel } from "../lib/paths.ts";

interface Problem {
    id: string;
    title: string;
    url?: string;
    editorialUrl?: string;
}

async function main() {
    const problems: string[] = [];

    /* ---- Markdown links ------------------------------------------------ */
    const pages = new Set<string>();
    const files = await fg("**/*.md", { cwd: DOCS_DIR, absolute: true, onlyFiles: true });
    for (const file of files) {
        const relativePath = rel(ROOT, file).replace(/^docs\//, "");
        const withoutExtension = relativePath.replace(/\.md$/, "");
        // A page is addressable both with and without its trailing slash.
        const canonical = withoutExtension.endsWith("/index")
            ? withoutExtension.slice(0, -"/index".length)
            : withoutExtension;
        pages.add("/" + canonical);
        pages.add("/" + canonical + "/");
        pages.add("/" + withoutExtension);
    }

    /** Resolve a site-absolute path, ignoring the trailing slash. */
    const resolves = (href: string): boolean => {
        const target = href.split("#")[0]!;
        if (!target) return true;
        if (pages.has(target)) return true;
        if (pages.has(target.replace(/\/$/, ""))) return true;
        if (existsSync(join(DOCS_DIR, "public", target))) return true;
        if (existsSync(join(DOCS_DIR, "public", target.replace(/\/$/, "")))) return true;
        return false;
    };

    const linkPattern = /\[[^\]]*\]\(([^)\s]+)\)/g;
    for (const file of files) {
        const source = await readFile(file, "utf8");
        // Only the prose is checked; a link inside a fenced block is an example.
        const prose = source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
        let match: RegExpExecArray | null;
        while ((match = linkPattern.exec(prose)) !== null) {
            const href = match[1]!;
            if (/^https?:/.test(href) || href.startsWith("mailto:")) continue;
            if (href.startsWith("#")) continue;
            if (href.startsWith("/")) {
                if (resolves(href)) continue;
                problems.push(`${rel(ROOT, file)}: the link "${href}" does not resolve to a page`);
                continue;
            }
            const target = resolve(file, "..", href);
            if (!existsSync(target)) {
                problems.push(
                    `${rel(ROOT, file)}: the relative link "${href}" does not resolve to a file`,
                );
            }
        }
    }

    /* ---- Problem records ----------------------------------------------- */
    const problemFiles = await fg("*.yaml", {
        cwd: join(ROOT, "data", "problems"),
        absolute: true,
        onlyFiles: true,
    });
    /*
     * A judge that does not serve HTTPS is allowed by name. The link opens the
     * judge in a new tab, so it cannot create mixed content on this site, and
     * POJ has no working TLS endpoint.
     */
    const HTTP_ONLY_HOSTS = new Set(["poj.org"]);

    const problems_: Problem[] = [];
    for (const file of problemFiles) {
        const raw = parseYaml(await readFile(file, "utf8")) as Problem;
        problems_.push(raw);
        for (const [field, value] of [
            ["url", raw.url],
            ["editorialUrl", raw.editorialUrl],
        ] as const) {
            if (!value) continue;
            let host = "";
            try {
                host = new URL(value).hostname;
            } catch {
                host = "";
            }
            const allowed =
                /^https:\/\//.test(value) ||
                (value.startsWith("http://") && HTTP_ONLY_HOSTS.has(host));
            if (!allowed) {
                problems.push(`${rel(ROOT, file)}: the ${field} is not an https address`);
            }
        }
    }

    /* ---- Navigation targets -------------------------------------------- */
    const config = await readFile(join(ROOT, "docs", ".vitepress", "config.ts"), "utf8");
    const navPattern = /link:\s*'([^']+)'/g;
    let match: RegExpExecArray | null;
    while ((match = navPattern.exec(config)) !== null) {
        const href = match[1]!;
        if (!href.startsWith("/")) continue;
        if (pages.has(href)) continue;
        problems.push(
            `docs/.vitepress/config.ts: the navigation link "${href}" does not resolve to a page`,
        );
    }

    if (problems.length > 0) {
        for (const message of problems) process.stderr.write(`error: ${message}\n`);
        process.stderr.write(`\n${problems.length} broken link(s) found.\n`);
        process.exit(1);
    }

    process.stdout.write(
        `all links resolve: ${files.length} pages, ${problems_.length} problems\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
