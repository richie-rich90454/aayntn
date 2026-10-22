/**
 * Deterministic layouts.
 *
 * Graph pictures must be reproducible: the same input always produces the
 * same arrangement. Nothing here uses randomness, and nothing here depends on
 * the DOM.
 */

export interface Point {
    x: number;
    y: number;
}

export interface GraphInput {
    /** Adjacency list, indexed by vertex number. */
    adjacency: number[][];
    /** Optional fixed positions that override the automatic layout. */
    positions?: Map<number, Point>;
    /** Optional labels. */
    labels?: string[];
}

/** Place `count` vertices evenly on a circle. */
export function circleLayout(count: number, width = 720, height = 460): Point[] {
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 2 - 70;
    const radiusY = height / 2 - 60;
    const points: Point[] = [];
    for (let index = 0; index < count; index += 1) {
        const angle = (2 * Math.PI * index) / count - Math.PI / 2;
        points.push({
            x: Math.round(centerX + radiusX * Math.cos(angle)),
            y: Math.round(centerY + radiusY * Math.sin(angle)),
        });
    }
    return points;
}

/** Place `count` vertices on a grid, row major. */
export function gridLayout(count: number, width = 720, height = 460, columns = 5): Point[] {
    const rows = Math.ceil(count / columns);
    const cellWidth = width / columns;
    const cellHeight = height / Math.max(rows, 1);
    const points: Point[] = [];
    for (let index = 0; index < count; index += 1) {
        const row = Math.floor(index / columns);
        const column = index % columns;
        points.push({
            x: Math.round(cellWidth * column + cellWidth / 2),
            y: Math.round(cellHeight * row + cellHeight / 2),
        });
    }
    return points;
}

/**
 * A layered layout for a rooted tree.
 *
 * Depth decides the row; siblings are spread evenly inside their row, and a
 * subtree is kept as close to its parent as the layout allows.
 */
export function treeLayout(children: number[][], root = 0, width = 720, height = 460): Point[] {
    const count = children.length;
    const depth = new Array<number>(count).fill(0);
    const order: number[] = [root];
    for (let index = 0; index < order.length; index += 1) {
        const vertex = order[index]!;
        for (const child of children[vertex] ?? []) {
            depth[child] = depth[vertex]! + 1;
            order.push(child);
        }
    }

    const maxDepth = Math.max(0, ...depth);
    const rowHeight = maxDepth === 0 ? height / 2 : (height - 80) / maxDepth;
    const positions = new Array<Point>(count);
    const usedPerRow = new Map<number, number>();
    const rowTotals = new Map<number, number>();
    for (let index = 0; index < count; index += 1) {
        const level = depth[index]!;
        rowTotals.set(level, (rowTotals.get(level) ?? 0) + 1);
    }

    for (let index = 0; index < count; index += 1) {
        const level = depth[index]!;
        const total = rowTotals.get(level)!;
        const used = usedPerRow.get(level) ?? 0;
        usedPerRow.set(level, used + 1);
        const spacing = width / (total + 1);
        positions[index] = {
            x: Math.round(spacing * (used + 1)),
            y: Math.round(50 + level * rowHeight),
        };
    }

    // Pull each child toward the midpoint between its parent's slots.
    for (const parent of order) {
        const kids = children[parent] ?? [];
        if (kids.length === 0) continue;
        const parentX = positions[parent]!.x;
        const kidXs = kids.map((kid) => positions[kid]!.x);
        const average = kidXs.reduce((sum, value) => sum + value, 0) / kidXs.length;
        const shift = (parentX - average) / (kids.length + 1);
        kids.forEach((kid, index) => {
            positions[kid] = {
                x: Math.round(positions[kid]!.x + shift * (index + 1)),
                y: positions[kid]!.y,
            };
        });
    }

    return positions;
}
