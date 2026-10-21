/**
 * Lazy loader for the Shiki-highlighted implementation fragments.
 *
 * The fragments live under `docs/.vitepress/data/generated/src/` and are
 * code-split by Vite, so a reader only downloads the implementation they
 * actually open.
 */
const modules = import.meta.glob("./generated/src/**/*.html", { query: "?raw", import: "default" });

export async function loadImplementationHtml(
    algorithm: string,
    language: string,
    variant: string,
): Promise<string | null> {
    const key = `./generated/src/${algorithm}/${language}.${variant}.html`;
    const loader = modules[key] as (() => Promise<string>) | undefined;
    if (!loader) return null;
    return loader();
}

export function hasImplementationHtml(
    algorithm: string,
    language: string,
    variant: string,
): boolean {
    return Boolean(modules[`./generated/src/${algorithm}/${language}.${variant}.html`]);
}
