/**
 * The mathematical macros that aayntn adds to KaTeX.
 *
 * The same table is used by the site renderer and by the content validator,
 * so an expression that the site can render is never rejected by the build,
 * and an expression that the site cannot render never passes the build.
 */
export const katexMacros: Record<string, string> = {
    "\\O": "\\mathcal{O}",
    "\\adj": "\\operatorname{adj}",
    "\\dist": "\\operatorname{dist}",
    "\\deg": "\\operatorname{deg}",
    "\\mod": "\\bmod",
    "\\lcm": "\\operatorname{lcm}",
};
