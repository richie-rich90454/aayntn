/**
 * The lowest common ancestor.
 *
 * The reference implementation is the one in the article: a breadth-first
 * walk that fixes the depth of every vertex, a table of the 2^k-th ancestor
 * of every vertex, and a query that first lifts the deeper vertex and then
 * climbs both vertices together. The picture shows the tree with the two
 * paths that the query follows.
 */
import { treeLayout } from "../core/layout";
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Parsed {
    labels: string[];
    children: number[][];
    queries: { left: number; right: number }[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0) throw new Error('Provide the tree as "root: child child" lines.');

    const labels: string[] = [];
    const adjacency: number[][] = [];
    const pending: { from: number; to: number }[] = [];
    const queries: { left: number; right: number }[] = [];

    const indexOf = (name: string): number => {
        const found = labels.indexOf(name);
        if (found !== -1) return found;
        labels.push(name);
        adjacency.push([]);
        return labels.length - 1;
    };

    for (const line of lines) {
        if (line.toLowerCase().startsWith("lca")) {
            const parts = line.split(/[\s,]+/).filter(Boolean);
            if (parts.length !== 3)
                throw new Error(`An lca query needs two vertices, found "${line}".`);
            queries.push({ left: indexOf(parts[1]!), right: indexOf(parts[2]!) });
            continue;
        }
        const [head, ...rest] = line.split(":");
        const name = (head ?? "").trim();
        if (!name) continue;
        const from = indexOf(name);
        for (const token of rest
            .join(" ")
            .split(/[\s,]+/)
            .filter(Boolean)) {
            pending.push({ from, to: indexOf(token) });
        }
    }

    if (labels.length === 0) throw new Error("The tree must name at least one vertex.");
    if (pending.length === 0) throw new Error("The tree must have at least one edge.");

    const children: number[][] = Array.from({ length: labels.length }, () => []);
    const seen = new Set<string>();
    for (const { from, to } of pending) {
        const key = from < to ? `${from}-${to}` : `${to}-${from}`;
        if (seen.has(key)) continue;
        seen.add(key);
        adjacency[from]!.push(to);
        adjacency[to]!.push(from);
    }

    // The parent of every vertex, found by a walk from the root.
    const parent = new Array<number>(labels.length).fill(-1);
    const order = [0];
    parent[0] = 0;
    for (let index = 0; index < order.length; index += 1) {
        const vertex = order[index]!;
        for (const neighbour of adjacency[vertex]!) {
            if (parent[neighbour] !== -1) continue;
            parent[neighbour] = vertex;
            order.push(neighbour);
        }
    }
    for (const vertex of order) {
        for (const neighbour of adjacency[vertex]!) {
            if (parent[neighbour] === vertex) children[vertex]!.push(neighbour);
        }
    }

    if (order.length !== labels.length)
        throw new Error(
            "The tree must be connected, so that every vertex is reachable from the root.",
        );

    return { labels, children, queries };
}

function build(input: string): LabEvent[] {
    const { labels, children, queries } = parse(input);
    const events: LabEvent[] = [];

    const count = labels.length;
    const parent = new Array<number>(count).fill(0);
    const depth = new Array<number>(count).fill(-1);
    const positions = treeLayout(children, 0, 720, 380);

    let levels = 1;
    while (1 << levels <= count) levels += 1;
    const up: number[][] = Array.from({ length: levels }, () => new Array<number>(count).fill(0));

    /** The vertices the current step walks over. */
    let active: number[] = [];

    const pathTo = (vertex: number): number[] => {
        const path = [vertex];
        let walker = vertex;
        while (parent[walker] !== walker) {
            walker = parent[walker]!;
            path.push(walker);
        }
        return path;
    };

    const snapshot = (note: string, formula?: string): LabState => {
        const highlight = new Set(active);
        const onPath = new Set(active.flatMap((vertex) => pathTo(vertex)));
        return {
            nodes: labels.map((label, index) => ({
                id: String(index),
                label,
                x: positions[index]!.x,
                y: positions[index]!.y,
                state: highlight.has(index)
                    ? ("active" as const)
                    : onPath.has(index)
                      ? ("discovered" as const)
                      : ("unvisited" as const),
                value: depth[index]! >= 0 ? `d=${depth[index]}` : undefined,
                marker: index === 0 ? "root" : undefined,
            })),
            edges: labels.flatMap((_, index) =>
                children[index]!.map((child) => ({
                    from: String(index),
                    to: String(child),
                    directed: true,
                    state:
                        onPath.has(child) && onPath.has(index)
                            ? ("active" as const)
                            : ("tree" as const),
                })),
            ),
            cells: [],
            structures: [],
            annotations: [{ x: 30, y: 30, text: note, emphasis: "accent" }],
            data: { depth: [...depth], up: up.map((row) => [...row]) },
            formula,
        };
    };

    events.push({
        type: "init",
        operation: "init",
        narration: `The tree has ${count} vertices and is rooted at ${labels[0]}.`,
        state: snapshot(`The root is ${labels[0]}.`, `depth(${labels[0]}) = 0`),
    });

    // The breadth-first walk fixes the depth of every vertex.
    depth[0] = 0;
    const order = [0];
    for (let index = 0; index < order.length; index += 1) {
        const vertex = order[index]!;
        for (const child of children[vertex]!) {
            depth[child] = depth[vertex]! + 1;
            parent[child] = vertex;
            up[0]![child] = vertex;
            order.push(child);
        }
    }

    for (const vertex of order) {
        active = [vertex];
        events.push({
            type: "build",
            operation: "build-table",
            narration:
                vertex === 0
                    ? `The root ${labels[0]} has depth 0 and is its own ancestor.`
                    : `The depth of ${labels[vertex]} is ${depth[vertex]}, and its parent is ${labels[parent[vertex]!]}.`,
            state: snapshot(
                vertex === 0
                    ? `The root ${labels[0]} has depth 0.`
                    : `depth(${labels[vertex]}) = ${depth[vertex]}`,
                `depth(${labels[vertex]}) = ${depth[vertex]}`,
            ),
        });
    }
    active = [];

    // The table of the 2^k-th ancestors is built from the table below it.
    for (let level = 1; level < levels; level += 1) {
        for (let vertex = 0; vertex < count; vertex += 1) {
            up[level]![vertex] = up[level - 1]![up[level - 1]![vertex]!]!;
        }
        active = [0];
        events.push({
            type: "build",
            operation: "build-table",
            narration: `The row of the ${1 << level}-th ancestors is filled from the row of the ${1 << (level - 1)}-th ancestors, so every jump of ${1 << level} edges is one lookup.`,
            state: snapshot(
                `The row for jumps of ${1 << level} edges is ready.`,
                `up[${level}][v] = up[${level - 1}][up[${level - 1}][v]]`,
            ),
        });
    }
    active = [];

    for (const query of queries) {
        let u = query.left;
        let v = query.right;

        if (depth[u]! < 0 || depth[v]! < 0)
            throw new Error("Every vertex of a query must belong to the tree.");

        if (depth[u]! < depth[v]!) {
            const swap = u;
            u = v;
            v = swap;
        }

        const difference = depth[u]! - depth[v]!;
        if (difference > 0) {
            events.push({
                type: "lift",
                operation: "lift",
                narration: `${labels[u]} is ${difference} edges deeper than ${labels[v]}, so it is lifted until both stand at the same depth.`,
                state: snapshot(
                    `The depth difference is ${difference}.`,
                    `depth(${labels[u]}) - depth(${labels[v]}) = ${difference}`,
                ),
            });
        }

        for (let level = 0; level < levels; level += 1) {
            if (((difference >> level) & 1) === 0) continue;
            const target = up[level]![u]!;
            active = [u, target];
            events.push({
                type: "lift",
                operation: "lift",
                narration: `A jump of ${1 << level} edges takes ${labels[u]} to ${labels[target]}, which is one lookup in the table.`,
                state: snapshot(
                    `${labels[u]} is lifted by ${1 << level} edges.`,
                    `up[${level}][${labels[u]}] = ${labels[target]}`,
                ),
            });
            u = target;
        }
        active = [];

        if (u === v) {
            events.push({
                type: "finish",
                operation: "lca",
                narration: `The two vertices now stand on the same vertex ${labels[u]}, so the lowest common ancestor is ${labels[u]}.`,
                state: snapshot(
                    `The lowest common ancestor is ${labels[u]}.`,
                    `lca = ${labels[u]}`,
                ),
            });
            continue;
        }

        for (let level = levels - 1; level >= 0; level -= 1) {
            const ancestorU = up[level]![u]!;
            const ancestorV = up[level]![v]!;
            if (ancestorU === ancestorV) continue;
            active = [u, v, ancestorU, ancestorV];
            events.push({
                type: "lift",
                operation: "lift",
                narration: `The ${1 << level}-th ancestors of ${labels[u]} and ${labels[v]} are ${labels[ancestorU]} and ${labels[ancestorV]}, which differ, so both vertices are lifted by ${1 << level} edges.`,
                state: snapshot(
                    `Both vertices are lifted by ${1 << level} edges.`,
                    `up[${level}][${labels[u]}] = ${labels[ancestorU]}`,
                ),
            });
            u = ancestorU;
            v = ancestorV;
        }
        active = [];

        const ancestor = up[0]![u]!;
        events.push({
            type: "finish",
            operation: "lca",
            narration: `The two vertices now stand directly below their common ancestor ${labels[ancestor]}, so the lowest common ancestor is ${labels[ancestor]}.`,
            state: snapshot(
                `The lowest common ancestor is ${labels[ancestor]}.`,
                `lca = ${labels[ancestor]}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration: "Every query answers from the table of ancestors, without walking the tree.",
        state: snapshot("The table is complete.", `${levels} rows`),
    });

    return events;
}

export const lca: LabDefinition = {
    id: "trees.lca",
    title: "Lowest common ancestor",
    scene: "tree",
    description:
        "Answers the lowest common ancestor of two vertices with a table of the ancestors of every vertex, using binary lifting.",
    maxInputLength: 400,
    presets: [
        {
            id: "siblings",
            label: "Two branches",
            input: "A: B C\nB: D E\nC: F G\nlca D F\nlca E G",
        },
        {
            id: "ancestor",
            label: "One is an ancestor",
            input: "A: B C\nB: D\nC: E\nlca B E\nlca A D",
        },
        {
            id: "chain",
            label: "A chain",
            input: "A: B\nB: C\nC: D\nD: E\nlca A E",
        },
    ],
    notes: [
        "The number under a vertex is its depth, the number of edges from the root.",
        "A gold vertex is one that the current step lifts, and the edges under it are the path the query follows.",
        "Each lift is a jump of a power of two, and every jump is one lookup in the table of ancestors.",
    ],
    build,
};
