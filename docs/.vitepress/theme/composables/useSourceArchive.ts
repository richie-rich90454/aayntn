/**
 * Restore syntax color on the source archive.
 *
 * The archive page carries the exact source as plain text, which keeps the
 * build small and the page readable without JavaScript. The highlighted
 * fragment for every listing is already published beside the raw file, so the
 * page fetches that fragment when the listing approaches the viewport and
 * swaps it in. The source is byte-identical either way; only the color is
 * added.
 */

const PLACEHOLDER = ".aayntn-source[data-source-fragment]";

function swap(node: HTMLElement, html: string): void {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const fragment = template.content.firstElementChild as HTMLElement | null;
    if (!fragment) return;
    fragment.classList.add("aayntn-source", "aayntn-source--highlighted");
    node.replaceWith(fragment);
}

async function load(node: HTMLElement): Promise<void> {
    const id = node.dataset["sourceFragment"];
    if (!id || node.dataset["sourceLoaded"] === "yes") return;
    node.dataset["sourceLoaded"] = "yes";

    try {
        const response = await fetch(`${import.meta.env.BASE_URL}implementations/${id}.html`);
        if (!response.ok) return;
        swap(node, await response.text());
    } catch {
        // The plain source is already on the page; a failed fetch changes nothing.
    }
}

/** Apply the enhancement once, for the current page. */
export function enhanceSourceArchive(): void {
    if (typeof document === "undefined") return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(PLACEHOLDER));
    if (nodes.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
        for (const node of nodes) void load(node);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const node = entry.target as HTMLElement;
                observer.unobserve(node);
                void load(node);
            }
        },
        { rootMargin: "600px 0px" },
    );

    for (const node of nodes) observer.observe(node);
}
