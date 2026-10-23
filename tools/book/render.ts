/**
 * Shared rendering for the printable book and the language card.
 *
 * Both artifacts use the same Markdown parser, KaTeX configuration and code
 * theme as the site, so a formula or a listing cannot look different in the
 * PDF from the way it looks in the browser.
 */
import MarkdownIt, { type MarkdownIt as MarkdownItInstance } from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { createHighlighter, type Highlighter } from "shiki";
import { aayntnLight } from "../../docs/.vitepress/theme/shiki-theme.ts";
import { katexMacros } from "../../docs/.vitepress/theme/katex-macros.ts";

export const CODE_LANGUAGES = ["c", "cpp", "java", "python", "pascal", "javascript"] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Map a fence or preset name to the language identifier the book emits. */
export function normalizeLanguage(language: string): CodeLanguage | "text" {
    switch (language.trim().toLowerCase()) {
        case "c":
            return "c";
        case "cpp":
        case "c++":
        case "cpp17":
            return "cpp";
        case "java":
            return "java";
        case "python":
        case "py":
            return "python";
        case "pascal":
        case "pas":
            return "pascal";
        case "javascript":
        case "js":
            return "javascript";
        default:
            return "text";
    }
}

function shikiLanguage(language: CodeLanguage | "text"): string {
    return language;
}

export function highlightCode(highlighter: Highlighter, code: string, language: string): string {
    const display = normalizeLanguage(language);
    return highlighter.codeToHtml(code, {
        lang: shikiLanguage(display),
        theme: "aayntn-light",
        transformers: [
            {
                name: "aayntn-book-language",
                pre(node) {
                    node.properties["data-language"] = display;
                },
            },
        ],
    });
}

export async function createBookMarkdown(): Promise<{
    md: MarkdownItInstance;
    highlighter: Highlighter;
}> {
    const highlighter = await createHighlighter({
        themes: [aayntnLight],
        langs: [...CODE_LANGUAGES, "text"],
    });

    const md = new MarkdownIt({
        html: true,
        linkify: false,
        typographer: false,
    });

    md.use(katex as never, {
        delimiters: "dollars",
        throwOnError: false,
        strict: false,
        trust: false,
        output: "html",
        macros: katexMacros,
    });

    md.options.highlight = (code, language) => highlightCode(highlighter, code, language);

    return { md, highlighter };
}
