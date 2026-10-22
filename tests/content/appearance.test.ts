/**
 * The two appearances.
 *
 * The dark appearance is not the light one with the lights turned off. It
 * has its own surfaces, its own rules and its own colors, and this suite
 * holds it to the same standard as the light one: every pair of colors that
 * the theme puts together must be legible, and every surface must be a
 * different value from the one that surrounds it.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../../tools/lib/paths";

const TOKENS = join(ROOT, "docs/.vitepress/theme/styles/tokens.css");

/** The custom properties of a block of a stylesheet. */
async function block(selector: string, from = 0): Promise<Record<string, string>> {
    const source = await readFile(TOKENS, "utf8");
    const index = source.indexOf(selector, from);
    if (index === -1) return {};
    const open = source.indexOf("{", index);
    const close = source.indexOf("}", open);
    const result: Record<string, string> = {};
    for (const match of source.slice(open + 1, close).matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
        result[match[1]!] = match[2]!.trim();
    }
    return result;
}

/** Resolve a value that names another custom property. */
function resolve(value: string, tokens: Record<string, string>, seen = new Set<string>()): string {
    const name = value.match(/var\(--([a-z0-9-]+)\)/i)?.[1];
    if (!name || seen.has(name)) return value;
    const next = tokens[name];
    if (!next) return value;
    seen.add(name);
    return resolve(next, tokens, seen);
}

function channel(value: number): number {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
    const hex = color.trim().match(/^#([0-9a-f]{3,8})$/i)?.[1];
    if (!hex) return Number.NaN;
    const full =
        hex.length === 3
            ? hex
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : hex.slice(0, 6);
    return (
        0.2126 * channel(parseInt(full.slice(0, 2), 16)) +
        0.7152 * channel(parseInt(full.slice(2, 4), 16)) +
        0.0722 * channel(parseInt(full.slice(4, 6), 16))
    );
}

function ratio(foreground: string, background: string): number {
    const a = luminance(foreground);
    const b = luminance(background);
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
}

/** The pairs that the theme puts together, and the ratio each must reach. */
const PAIRS: [string, string, number][] = [
    ["text-primary", "surface-page", 4.5],
    ["text-primary", "surface-content", 4.5],
    ["text-primary", "surface-raised", 4.5],
    ["text-primary", "surface-sunken", 4.5],
    ["text-primary", "surface-rail", 4.5],
    ["text-secondary", "surface-page", 4.5],
    ["text-secondary", "surface-content", 4.5],
    ["text-secondary", "surface-raised", 4.5],
    ["text-muted", "surface-page", 4.5],
    ["text-muted", "surface-content", 4.5],
    ["text-muted", "surface-raised", 4.5],
    ["text-link", "surface-page", 4.5],
    ["text-link", "surface-content", 4.5],
    ["text-link", "surface-raised", 4.5],
    ["text-accent", "surface-page", 4.5],
    ["text-accent", "surface-content", 4.5],
    ["text-accent", "surface-raised", 4.5],
    ["color-white", "surface-inverse", 4.5],
    ["text-primary", "surface-code", 4.5],
    ["text-secondary", "surface-code", 4.5],
    ["color-white", "color-cobalt", 4.5],
    ["color-white", "color-primary", 4.5],
    ["color-black", "color-gold", 4.5],
    ["color-white", "division-bronze", 4.5],
    ["color-white", "division-silver", 4.5],
    ["color-black", "division-gold", 4.5],
    ["color-white", "division-platinum", 4.5],
];

const light = await block(":root");
const dark = await block("html.dark");
const division = await block("html {");
const divisionDark = await block("html.dark {\n    --division-bronze");

const appearances: [string, Record<string, string>][] = [
    ["light", { ...light, ...division }],
    ["dark", { ...light, ...dark, ...divisionDark }],
];

describe("the appearances", () => {
    for (const [name, tokens] of appearances) {
        it(`keeps every pair of colors legible in the ${name} appearance`, () => {
            for (const [foreground, background, needed] of PAIRS) {
                const a = resolve(tokens[foreground] ?? "", tokens);
                const b = resolve(tokens[background] ?? "", tokens);
                expect(
                    ratio(a, b),
                    `${foreground} (${a}) on ${background} (${b})`,
                ).toBeGreaterThanOrEqual(needed);
            }
        });
    }

    it("gives every surface of the dark appearance its own value", () => {
        const surfaces = [
            "surface-page",
            "surface-content",
            "surface-raised",
            "surface-sunken",
            "surface-rail",
            "surface-code",
            "surface-inverse",
        ];
        const values = surfaces.map((name) => resolve(dark[name] ?? "", { ...light, ...dark }));
        for (let index = 0; index < surfaces.length; index += 1) {
            for (let other = index + 1; other < surfaces.length; other += 1) {
                expect(
                    values[index],
                    `${surfaces[index]} and ${surfaces[other]} are the same value in the dark appearance`,
                ).not.toBe(values[other]);
            }
        }
    });

    it("keeps the text of the dark appearance brighter than the text of the light one", () => {
        expect(
            luminance(resolve(dark["text-primary"] ?? "", { ...light, ...dark })),
        ).toBeGreaterThan(luminance(resolve(light["text-primary"] ?? "", light)));
    });
});
