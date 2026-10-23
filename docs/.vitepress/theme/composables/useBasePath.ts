/**
 * The path of a page, with the publication base taken off.
 *
 * A site published under a path reports its route with that path in front of
 * it, while the navigation describes its destinations without it. Comparing
 * the two without this step is why no sidebar link ever matched on the
 * published site while every local build looked correct.
 */

export function stripBase(path: string, base: string): string {
    const clean = path.split("?")[0]!.split("#")[0]!;
    const without =
        base !== "/" && base !== "" && clean.startsWith(base)
            ? "/" + clean.slice(base.length)
            : clean;
    return without.replace(/\/+$/, "") || "/";
}

/** The same, for the base this build is made with. */
export function pagePath(path: string): string {
    return stripBase(path, import.meta.env.BASE_URL);
}
