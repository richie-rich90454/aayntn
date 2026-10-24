import type { MarkdownOptions } from "vitepress";

/** The renderer instance that the site configuration hands to a plugin. */
type Markdown = Parameters<NonNullable<MarkdownOptions["config"]>>[0];

/**
 * The mathematical panel.
 *
 * A definition, lemma, theorem, proof, invariant, recurrence, counterexample
 * or complexity result is written as a container:
 *
 *     ::: math definition Definition
 *     The **prefix count** is $f(k, y) = \sum w_j$.
 *     :::
 *
 * The body is ordinary Markdown, so the formulas, the emphasis and the links
 * inside a panel are compiled by the same rules as the prose around it. The
 * Vue component that used to wrap these panels could not do that: content
 * between its tags is a slot, and the Markdown compiler passes a slot through
 * as text.
 */

const TYPES = new Set([
    "definition",
    "lemma",
    "theorem",
    "proof",
    "invariant",
    "recurrence",
    "counterexample",
    "complexity",
]);

const OPEN = /^:::\s*math\s+([a-z-]+)(?:\s+(.*?))?\s*$/;

export function mathPanel(md: Markdown): void {
    md.block.ruler.before(
        "fence",
        "math_panel",
        (state, startLine, endLine, silent) => {
            const start = state.bMarks[startLine]! + state.tShift[startLine]!;
            const end = state.eMarks[startLine]!;
            const line = state.src.slice(start, end);
            const match = OPEN.exec(line);
            if (!match) return false;

            const type = match[1]!;
            if (!TYPES.has(type)) return false;
            if (silent) return true;

            let nextLine = startLine + 1;
            let closed = false;
            for (; nextLine < endLine; nextLine += 1) {
                const from = state.bMarks[nextLine]! + state.tShift[nextLine]!;
                const to = state.eMarks[nextLine]!;
                if (state.src.slice(from, to).trim() === ":::") {
                    closed = true;
                    break;
                }
            }
            if (!closed) return false;

            const title = match[2]?.trim() || type;
            const parent = state.parentType;
            const max = state.lineMax;
            state.parentType = "math_panel" as unknown as typeof state.parentType;
            state.lineMax = nextLine;

            const open = state.push("math_panel_open", "aside", 1);
            open.block = true;
            open.meta = { type, title };

            state.md.block.tokenize(state, startLine + 1, nextLine);

            const close = state.push("math_panel_close", "aside", -1);
            close.block = true;

            state.parentType = parent;
            state.lineMax = max;
            state.line = nextLine + 1;
            return true;
        },
        { alt: ["paragraph", "reference", "blockquote", "list"] },
    );

    md.renderer.rules["math_panel_open"] = (tokens, index) => {
        const meta = tokens[index]!.meta as { type: string; title: string };
        const title = md.utils.escapeHtml(meta.title);
        return `<aside class="aayntn-math aayntn-math--${meta.type}"><span class="aayntn-math__label">${title}</span><div class="aayntn-math__body">`;
    };
    md.renderer.rules["math_panel_close"] = () => "</div></aside>\n";
}
