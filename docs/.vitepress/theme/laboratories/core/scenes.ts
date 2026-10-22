/**
 * Scene primitives.
 *
 * Each scene turns a `LabState` into SVG markup. The functions are pure:
 * given the same state they always produce the same string, which is what
 * makes the visualization testable outside a browser.
 */
import type {
    LabCell,
    LabEdge,
    LabNode,
    LabState,
    LabStructure,
    LabTable,
    RenderOptions,
} from "./types";

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

/**
 * The colors that the laboratories draw with.
 *
 * The fields are read from the design tokens of the page, so that a picture
 * drawn on a dark page uses the colors of a dark page. The values are
 * written back into this object before every drawing, which is why it is
 * not frozen.
 */
export const PALETTE = {
    unvisitedFill: "#FFFFFF",
    unvisitedStroke: "#2847B8",
    discoveredFill: "#2847B8",
    discoveredStroke: "#203C91",
    activeFill: "#E8B84A",
    activeStroke: "#161616",
    completedFill: "#225B45",
    completedStroke: "#225B45",
    invalidFill: "#C63D32",
    invalidStroke: "#C63D32",
    selectedFill: "#593399",
    selectedStroke: "#593399",
    edgeIdle: "#B4BAC9",
    edgeActive: "#161616",
    edgeDone: "#225B45",
    edgeInvalid: "#C63D32",
    edgeTree: "#7B274B",
    text: "#161616",
    textInverse: "#FFFFFF",
    muted: "#6B7484",
    grid: "#E3E6EE",
    accent: "#E8B84A",
    surface: "#FFFFFF",
    highlight: "#FFF0BD",
    invalidSoft: "#FCE1E0",
};

/** The token that each field of the palette takes its value from. */
const PALETTE_TOKENS: Record<keyof typeof PALETTE, string> = {
    unvisitedFill: "--surface-raised",
    unvisitedStroke: "--color-cobalt",
    discoveredFill: "--color-cobalt",
    discoveredStroke: "--color-ultramarine",
    activeFill: "--color-gold",
    activeStroke: "--color-black",
    completedFill: "--color-emerald",
    completedStroke: "--color-emerald",
    invalidFill: "--color-vermilion",
    invalidStroke: "--color-vermilion",
    selectedFill: "--color-violet",
    selectedStroke: "--color-violet",
    edgeIdle: "--border-strong",
    edgeActive: "--text-primary",
    edgeDone: "--color-emerald",
    edgeInvalid: "--color-vermilion",
    edgeTree: "--color-oxblood",
    text: "--text-primary",
    textInverse: "--color-white",
    muted: "--text-muted",
    grid: "--border-subtle",
    accent: "--color-gold",
    surface: "--surface-raised",
    highlight: "--color-highlight",
    invalidSoft: "--color-invalid-soft",
};

/**
 * Read the palette from the page.
 *
 * The browser is the only place that knows which appearance is in force, so
 * the tokens are read from the document rather than guessed at.
 */
export function refreshPalette(): void {
    if (typeof document === "undefined") return;
    const style = getComputedStyle(document.documentElement);
    for (const [field, token] of Object.entries(PALETTE_TOKENS) as [
        keyof typeof PALETTE,
        string,
    ][]) {
        const value = style.getPropertyValue(token).trim();
        if (value) PALETTE[field] = value;
    }
}

/**
 * The style of each state of a node.
 *
 * The table is built every time it is asked for, because the colors of the
 * page change with the appearance and the table holds the colors of the page.
 */
function nodeStateStyle(): Record<string, { fill: string; stroke: string; text: string }> {
    return {
        unvisited: {
            fill: PALETTE.unvisitedFill,
            stroke: PALETTE.unvisitedStroke,
            text: PALETTE.text,
        },
        discovered: {
            fill: PALETTE.discoveredFill,
            stroke: PALETTE.discoveredStroke,
            text: PALETTE.textInverse,
        },
        active: {
            fill: PALETTE.activeFill,
            stroke: PALETTE.activeStroke,
            text: PALETTE.text,
        },
        completed: {
            fill: PALETTE.completedFill,
            stroke: PALETTE.completedStroke,
            text: PALETTE.textInverse,
        },
        invalid: {
            fill: PALETTE.invalidFill,
            stroke: PALETTE.invalidStroke,
            text: PALETTE.textInverse,
        },
        selected: {
            fill: PALETTE.selectedFill,
            stroke: PALETTE.selectedStroke,
            text: PALETTE.textInverse,
        },
    };
}

/** The style of each state of a cell. */
function cellStateStyle(): Record<string, { fill: string; stroke: string; text: string }> {
    return {
        idle: { fill: PALETTE.surface, stroke: PALETTE.edgeIdle, text: PALETTE.text },
        active: { fill: PALETTE.activeFill, stroke: PALETTE.text, text: PALETTE.text },
        done: {
            fill: PALETTE.discoveredFill,
            stroke: PALETTE.discoveredStroke,
            text: PALETTE.textInverse,
        },
        highlight: { fill: PALETTE.highlight, stroke: PALETTE.accent, text: PALETTE.text },
        invalid: { fill: PALETTE.invalidSoft, stroke: PALETTE.invalidFill, text: PALETTE.text },
    };
}

/* ------------------------------------------------------------------ */
/* Escaping helpers                                                   */
/* ------------------------------------------------------------------ */

export function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/* ------------------------------------------------------------------ */
/* Graph and tree scenes                                               */
/* ------------------------------------------------------------------ */

function renderEdge(edge: LabEdge, nodes: Map<string, LabNode>): string {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) return "";

    const state = edge.state ?? "idle";
    const stroke =
        state === "active"
            ? PALETTE.edgeActive
            : state === "done"
              ? PALETTE.edgeDone
              : state === "invalid"
                ? PALETTE.edgeInvalid
                : state === "tree"
                  ? PALETTE.edgeTree
                  : PALETTE.edgeIdle;
    const width = state === "active" ? 2.6 : state === "idle" ? 1.3 : 1.8;
    const dash = state === "idle" ? "4 3" : undefined;

    const curve = edge.curve ?? 0;
    const x1 = from.x ?? 0;
    const y1 = from.y ?? 0;
    const x2 = to.x ?? 0;
    const y2 = to.y ?? 0;

    // Stop the line at the node boundary so that the arrow head is visible.
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const radius = 24;
    const sx = x2 - (dx / length) * radius;
    const sy = y2 - (dy / length) * radius;

    const path = curve
        ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - curve} ${sx} ${sy}`
        : `M ${x1} ${y1} L ${sx} ${sy}`;

    const markerId = `aayntn-arrow-${state}`;
    const parts: string[] = [];

    parts.push(
        `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}"${
            dash ? ` stroke-dasharray="${dash}"` : ""
        } marker-end="url(#${markerId})" />`,
    );

    const mx = (x1 + sx) / 2;
    const my = (y1 + sy) / 2 - (curve ? curve / 2 : 0);

    if (edge.label) {
        parts.push(
            `<rect x="${mx - 12}" y="${my - 10}" width="24" height="16" fill="${PALETTE.surface}" stroke="${PALETTE.grid}" />`,
            `<text x="${mx}" y="${my + 2}" text-anchor="middle" font-size="11" font-family="Noto Sans Mono, monospace" fill="${PALETTE.text}">${escapeXml(edge.label)}</text>`,
        );
    }

    if (edge.marker) {
        parts.push(
            `<text x="${mx}" y="${my + 14}" text-anchor="middle" font-size="9" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(edge.marker)}</text>`,
        );
    }

    return parts.join("");
}

function renderNode(node: LabNode): string {
    const state = node.state ?? "unvisited";
    const styles = nodeStateStyle();
    const style = styles[state] ?? styles["unvisited"]!;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const r = node.shape === "square" ? 18 : 22;

    const parts: string[] = [];

    if (node.shape === "diamond") {
        parts.push(
            `<path d="M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2" />`,
        );
    } else if (node.shape === "square") {
        parts.push(
            `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2" />`,
        );
    } else {
        parts.push(
            `<circle cx="${x}" cy="${y}" r="${r}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2" />`,
        );
    }

    parts.push(
        `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="600" font-family="Noto Sans, sans-serif" fill="${style.text}">${escapeXml(node.label)}</text>`,
    );

    if (node.value) {
        parts.push(
            `<text x="${x}" y="${y + r + 15}" text-anchor="middle" font-size="11" font-family="Noto Sans Mono, monospace" fill="${PALETTE.text}">${escapeXml(node.value)}</text>`,
        );
    }

    if (node.sublabel) {
        parts.push(
            `<text x="${x}" y="${y + r + 27}" text-anchor="middle" font-size="10" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(node.sublabel)}</text>`,
        );
    }

    // A non-color cue: the state name is always written next to the shape.
    if (node.marker) {
        parts.push(
            `<text x="${x + r + 4}" y="${y - r + 6}" font-size="9" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(node.marker)}</text>`,
        );
    }

    return parts.join("");
}

export function renderGraph(state: LabState, options: RenderOptions): string {
    const nodes = new Map(state.nodes.map((node) => [node.id, node]));
    const parts: string[] = [];

    for (const edge of state.edges) parts.push(renderEdge(edge, nodes));
    for (const node of state.nodes) parts.push(renderNode(node));

    if (options.showAnnotations) {
        for (const annotation of state.annotations) {
            const color =
                annotation.emphasis === "error"
                    ? PALETTE.invalidFill
                    : annotation.emphasis === "accent"
                      ? "#9A7415"
                      : PALETTE.muted;
            parts.push(
                `<text x="${annotation.x}" y="${annotation.y}" text-anchor="${annotation.anchor ?? "start"}" font-size="11" font-family="Noto Sans, sans-serif" fill="${color}">${escapeXml(annotation.text)}</text>`,
            );
        }
    }

    return parts.join("");
}

/* ------------------------------------------------------------------ */
/* Array scene                                                         */
/* ------------------------------------------------------------------ */

export function renderArray(state: LabState, options: RenderOptions): string {
    const cells = state.cells;
    if (!cells.length) return "";

    const cellWidth = 58;
    const cellHeight = 46;
    const gap = 6;
    const originX = 30;
    const originY = 60;
    const parts: string[] = [];

    parts.push(
        `<text x="${originX}" y="${originY - 24}" font-size="11" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">index</text>`,
    );

    cells.forEach((cell, index) => {
        const x = originX + index * (cellWidth + gap);
        const styles = cellStateStyle();
        const style = styles[cell.state ?? "idle"] ?? styles["idle"]!;
        parts.push(
            `<rect x="${x}" y="${originY}" width="${cellWidth}" height="${cellHeight}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.4" />`,
            `<text x="${x + cellWidth / 2}" y="${originY + 28}" text-anchor="middle" font-size="14" font-weight="600" font-family="Noto Sans Mono, monospace" fill="${style.text}">${escapeXml(cell.value)}</text>`,
            `<text x="${x + cellWidth / 2}" y="${originY - 8}" text-anchor="middle" font-size="10" font-family="Noto Sans Mono, monospace" fill="${PALETTE.muted}">${cell.index}</text>`,
        );
        if (cell.sublabel) {
            parts.push(
                `<text x="${x + cellWidth / 2}" y="${originY + cellHeight + 14}" text-anchor="middle" font-size="9" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(cell.sublabel)}</text>`,
            );
        }
    });

    if (state.axis) {
        const { min, max, cursor } = state.axis;
        const width = cells.length * (cellWidth + gap);
        const y = originY + cellHeight + 34;
        parts.push(
            `<line x1="${originX}" y1="${y}" x2="${originX + width}" y2="${y}" stroke="${PALETTE.muted}" stroke-width="1.2" />`,
            `<text x="${originX}" y="${y + 16}" font-size="10" font-family="Noto Sans Mono, monospace" fill="${PALETTE.muted}">${min}</text>`,
            `<text x="${originX + width}" y="${y + 16}" text-anchor="end" font-size="10" font-family="Noto Sans Mono, monospace" fill="${PALETTE.muted}">${max}</text>`,
        );
        if (cursor !== undefined) {
            const x = originX + (cursor - min) * (cellWidth + gap) + cellWidth / 2;
            parts.push(
                `<line x1="${x}" y1="${originY - 14}" x2="${x}" y2="${originY + cellHeight}" stroke="${PALETTE.accent}" stroke-width="2" />`,
            );
        }
    }

    if (options.showAnnotations) {
        for (const annotation of state.annotations) {
            parts.push(
                `<text x="${annotation.x}" y="${annotation.y}" text-anchor="${annotation.anchor ?? "start"}" font-size="11" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(annotation.text)}</text>`,
            );
        }
    }

    return parts.join("");
}

/* ------------------------------------------------------------------ */
/* Structure scene (stack, queue, heap, set)                           */
/* ------------------------------------------------------------------ */

export function renderStructures(state: LabState): string {
    const parts: string[] = [];
    let offsetX = 40;

    for (const structure of state.structures) {
        const vertical = (structure.orientation ?? "vertical") === "vertical";
        const cellWidth = 62;
        const cellHeight = 30;
        const gap = 4;

        parts.push(
            `<text x="${offsetX}" y="26" font-size="11" font-weight="600" font-family="Noto Sans, sans-serif" fill="${PALETTE.text}">${escapeXml(structure.label)}</text>`,
        );

        structure.items.forEach((item, index) => {
            const styles = cellStateStyle();
            const style = styles[item.state ?? "idle"] ?? styles["idle"]!;
            const x = vertical ? offsetX : offsetX + index * (cellWidth + gap);
            const y = vertical ? 44 + index * (cellHeight + gap) : 44;
            parts.push(
                `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.4" />`,
                `<text x="${x + cellWidth / 2}" y="${y + 19}" text-anchor="middle" font-size="12" font-family="Noto Sans Mono, monospace" fill="${style.text}">${escapeXml(item.value)}</text>`,
            );
            if (item.sublabel) {
                parts.push(
                    `<text x="${x + cellWidth / 2}" y="${y + cellHeight + 12}" text-anchor="middle" font-size="9" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">${escapeXml(item.sublabel)}</text>`,
                );
            }
        });

        // Arrow indicating the direction of the structure.
        if (structure.items.length > 1) {
            const from = vertical ? { x: offsetX - 12, y: 44 } : { x: offsetX, y: 36 };
            const to = vertical
                ? { x: offsetX - 12, y: 44 + (structure.items.length - 1) * (cellHeight + gap) }
                : {
                      x: offsetX + (structure.items.length - 1) * (cellWidth + gap) + cellWidth,
                      y: 36,
                  };
            parts.push(
                `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${PALETTE.muted}" stroke-width="1.2" marker-end="url(#aayntn-arrow-idle)" />`,
            );
        }

        offsetX += vertical ? 110 : structure.items.length * (cellWidth + gap) + 30;
    }

    return parts.join("");
}

/* ------------------------------------------------------------------ */
/* Table scene (dynamic programming)                                   */
/* ------------------------------------------------------------------ */

export function renderTable(state: LabState): string {
    const table: LabTable | undefined = state.table;
    if (!table) return "";

    const cellWidth = 62;
    const cellHeight = 34;
    const originX = 110;
    const originY = 60;
    const parts: string[] = [];

    parts.push(
        `<text x="${originX - 14}" y="${originY - 20}" text-anchor="end" font-size="11" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">row</text>`,
        `<text x="${originX}" y="${originY - 20}" font-size="11" font-family="Noto Sans, sans-serif" fill="${PALETTE.muted}">column</text>`,
    );

    table.colLabels.forEach((label, index) => {
        parts.push(
            `<text x="${originX + index * cellWidth + cellWidth / 2}" y="${originY - 8}" text-anchor="middle" font-size="10" font-family="Noto Sans Mono, monospace" fill="${PALETTE.muted}">${escapeXml(label)}</text>`,
        );
    });

    table.rowLabels.forEach((label, row) => {
        parts.push(
            `<text x="${originX - 10}" y="${originY + row * cellHeight + 21}" text-anchor="end" font-size="10" font-family="Noto Sans Mono, monospace" fill="${PALETTE.muted}">${escapeXml(label)}</text>`,
        );
    });

    for (const cell of table.cells) {
        const styles = cellStateStyle();
        const style = styles[cell.state ?? "idle"] ?? styles["idle"]!;
        const x = originX + cell.col * cellWidth;
        const y = originY + cell.row * cellHeight;
        parts.push(
            `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.2" />`,
            `<text x="${x + cellWidth / 2}" y="${y + 21}" text-anchor="middle" font-size="12" font-family="Noto Sans Mono, monospace" fill="${style.text}">${escapeXml(cell.value)}</text>`,
        );
    }

    return parts.join("");
}

/* ------------------------------------------------------------------ */
/* Shared defs                                                         */
/* ------------------------------------------------------------------ */

export function sceneDefs(): string {
    const markers = [
        ["idle", PALETTE.edgeIdle],
        ["active", PALETTE.edgeActive],
        ["done", PALETTE.edgeDone],
        ["invalid", PALETTE.edgeInvalid],
        ["tree", PALETTE.edgeTree],
    ];
    return markers
        .map(
            ([name, color]) =>
                `<marker id="aayntn-arrow-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color}" /></marker>`,
        )
        .join("");
}
