/**
 * The loader for the highlighted implementation fragments.
 *
 * The fragments are published as plain static files by the build, so a reader
 * downloads only the listing they actually open, and the bundler never has to
 * carry a hundred and fifty source listings in the module graph.
 */
const BASE = "/implementations";

export async function loadImplementationHtml(
    algorithm: string,
    language: string,
    variant: string,
): Promise<string | null> {
    // The server-side pass has no origin to resolve the path against, so the
    // panel is rendered as a shell and filled in by the browser.
    if (typeof window === "undefined") return null;
    const response = await fetch(`${BASE}/${algorithm}/${language}.${variant}.html`);
    if (!response.ok) return null;
    return response.text();
}

export function implementationSourceUrl(
    algorithm: string,
    language: string,
    variant: string,
    extension: string,
): string {
    return `${BASE}/${algorithm}/${language}.${variant}.${extension}`;
}
