/**
 * Disjoint set union.
 *
 * The reference implementation is the one in the article: a parent array
 * with a size array beside it, path compression inside `find`, and union by
 * size inside `unite`. The picture shows the forest, so that a union is an
 * arrow from one representative to another and a path compression is the
 * same forest drawn flatter.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Operation {
    kind: "unite" | "find" | "same";
    left: number;
    right?: number;
}

interface Parsed {
    count: number;
    operations: Operation[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) throw new Error("Provide the number of elements on the first line.");
    const head = lines[0]!.split(/[\s,]+/).filter(Boolean);
    if (head.length !== 1) throw new Error("The first line must hold the number of elements only.");
    const count = Number(head[0]);
    if (!Number.isInteger(count) || count < 1)
        throw new Error("The number of elements must be a positive integer.");

    const element = (token: string): number => {
        const value = Number(token);
        if (!Number.isInteger(value) || value < 0 || value >= count)
            throw new Error(`The element ${token} is outside the range 0..${count - 1}.`);
        return value;
    };

    const operations: Operation[] = [];
    for (const line of lines.slice(1)) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        const kind = parts[0];
        if (kind === "unite" || kind === "same") {
            if (parts.length !== 3)
                throw new Error(`"${kind}" needs two elements, found "${line}".`);
            operations.push({ kind, left: element(parts[1]!), right: element(parts[2]!) });
        } else if (kind === "find") {
            if (parts.length !== 2) throw new Error(`"find" needs one element, found "${line}".`);
            operations.push({ kind, left: element(parts[1]!) });
        } else {
            throw new Error(`Unknown operation "${kind ?? ""}": use unite, find or same.`);
        }
    }
    return { count, operations };
}

/**
 * The forest is drawn in rows: every representative on the top row, its
 * children one row below, and so on. The layout is recomputed from the
 * parent array, so the picture flattens as the run proceeds.
 */
function layoutForest(parent: number[]): Map<number, { x: number; y: number }> {
    const count = parent.length;
    const depth = new Array<number>(count).fill(0);
    let maxDepth = 0;
    for (let vertex = 0; vertex < count; vertex += 1) {
        let steps = 0;
        let walker = vertex;
        while (parent[walker] !== walker) {
            walker = parent[walker]!;
            steps += 1;
        }
        depth[vertex] = steps;
        if (steps > maxDepth) maxDepth = steps;
    }

    const levels: number[][] = [];
    for (let vertex = 0; vertex < count; vertex += 1) {
        const level = depth[vertex]!;
        if (!levels[level]) levels[level] = [];
        levels[level]!.push(vertex);
    }

    const positions = new Map<number, { x: number; y: number }>();
    const rowHeight = Math.min(75, 240 / Math.max(1, maxDepth));
    levels.forEach((level, index) => {
        const ordered = [...level].sort((a, b) => {
            const left = parent[a]! === a ? -1 : (positions.get(parent[a]!)?.x ?? -1);
            const right = parent[b]! === b ? -1 : (positions.get(parent[b]!)?.x ?? -1);
            return left - right || a - b;
        });
        const spacing = 700 / (ordered.length + 1);
        ordered.forEach((vertex, order) => {
            positions.set(vertex, {
                x: Math.round(spacing * (order + 1)),
                y: Math.round(160 + index * rowHeight),
            });
        });
    });
    return positions;
}

/** "1 element" or "3 elements". */
function countOf(count: number, word: string): string {
    return `${count} ${count === 1 ? word : `${word}s`}`;
}

function build(input: string): LabEvent[] {
    const { count, operations } = parse(input);
    const events: LabEvent[] = [];

    const parent: number[] = Array.from({ length: count }, (_, index) => index);
    const size: number[] = new Array<number>(count).fill(1);

    /** The edges that path compression has redrawn. */
    const compressed = new Set<string>();

    const rootOf = (start: number): number => {
        let vertex = start;
        while (parent[vertex] !== vertex) vertex = parent[vertex]!;
        return vertex;
    };

    const snapshot = (note: string, active: number | null, formula?: string): LabState => {
        const positions = layoutForest(parent);
        const setSize = (vertex: number): number => size[rootOf(vertex)]!;

        return {
            nodes: Array.from({ length: count }, (_, vertex) => ({
                id: String(vertex),
                label: String(vertex),
                x: positions.get(vertex)?.x ?? 0,
                y: positions.get(vertex)?.y ?? 0,
                state:
                    vertex === active
                        ? ("active" as const)
                        : parent[vertex] === vertex
                          ? ("completed" as const)
                          : ("unvisited" as const),
                value: `size ${setSize(vertex)}`,
                marker: parent[vertex] === vertex ? "root" : undefined,
            })),
            edges: Array.from({ length: count }, (_, vertex) => vertex)
                .filter((vertex) => parent[vertex] !== vertex)
                .map((vertex) => ({
                    from: String(vertex),
                    to: String(parent[vertex]!),
                    directed: true,
                    state: compressed.has(`${vertex}-${parent[vertex]!}`)
                        ? ("done" as const)
                        : ("tree" as const),
                    marker: "parent",
                })),
            cells: Array.from({ length: count }, (_, vertex) => ({
                index: vertex,
                value: String(parent[vertex]!),
                state:
                    vertex === active
                        ? ("active" as const)
                        : parent[vertex] === vertex
                          ? ("done" as const)
                          : ("idle" as const),
                sublabel:
                    parent[vertex] === vertex
                        ? `root, size ${setSize(vertex)}`
                        : `size ${setSize(vertex)}`,
            })),
            structures: [],
            annotations: [{ x: 90, y: 30, text: note, emphasis: "accent" }],
            data: { parent: [...parent], size: [...size] },
            formula,
        };
    };

    events.push({
        type: "init",
        operation: "init",
        narration: `There are ${countOf(count, "element")}, and every element starts in a set of its own.`,
        state: snapshot("Every element is its own representative.", null, `${count} sets`),
    });

    const find = (element: number): number => {
        const chain: number[] = [element];
        let root = element;
        while (parent[root] !== root) {
            root = parent[root]!;
            chain.push(root);
        }

        events.push({
            type: "find",
            operation: "find",
            narration: `The parent chain of ${element} is ${chain.join(" -> ")}, so the representative of ${element} is ${root}.`,
            state: snapshot(
                `Chain of ${element}: ${chain.join(" -> ")}.`,
                element,
                `find(${element}) = ${root}`,
            ),
        });

        if (chain.length > 2) {
            for (let index = 0; index < chain.length - 1; index += 1) {
                const child = chain[index]!;
                compressed.delete(`${child}-${parent[child]!}`);
                parent[child] = root;
                compressed.add(`${child}-${root}`);
            }
            events.push({
                type: "compress",
                operation: "compress-path",
                narration: `Every element on the chain now points straight at ${root}, so the next lookup of ${element} takes a single step.`,
                state: snapshot(
                    `The chain of ${element} is compressed to ${element} -> ${root}.`,
                    element,
                    `parent[${element}] = ${root}`,
                ),
            });
        }
        return root;
    };

    for (const operation of operations) {
        if (operation.kind === "find") {
            find(operation.left);
            continue;
        }

        if (operation.kind === "same") {
            const left = find(operation.left);
            const right = find(operation.right!);
            events.push({
                type: "compare",
                operation: "same",
                narration: `The representative of ${operation.left} is ${left} and the representative of ${operation.right} is ${right}, so they ${left === right ? "share" : "do not share"} a set.`,
                state: snapshot(
                    left === right
                        ? `${operation.left} and ${operation.right} are in the same set.`
                        : `${operation.left} and ${operation.right} are in different sets.`,
                    null,
                    `find(${operation.left}) = ${left}, find(${operation.right}) = ${right}`,
                ),
            });
            continue;
        }

        const rootA = find(operation.left);
        const rootB = find(operation.right!);

        if (rootA === rootB) {
            events.push({
                type: "unite",
                operation: "unite",
                narration: `Both elements already have the representative ${rootA}, so the union changes nothing.`,
                state: snapshot(
                    `Both elements are already in the set of ${rootA}.`,
                    null,
                    `unite(${operation.left}, ${operation.right}) is a no-op`,
                ),
            });
            continue;
        }

        // The larger set absorbs the smaller one, which keeps the trees shallow.
        let winner = rootA;
        let loser = rootB;
        if (size[winner]! < size[loser]!) {
            const swap = winner;
            winner = loser;
            loser = swap;
        }
        const before = size[winner]!;
        parent[loser] = winner;
        size[winner] = before + size[loser]!;
        compressed.delete(`${loser}-${parent[loser]!}`);
        compressed.add(`${loser}-${winner}`);

        events.push({
            type: "unite",
            operation: "unite",
            narration: `The set of ${loser} holds ${countOf(size[loser]!, "element")} and the set of ${winner} holds ${countOf(before, "element")}, so the set of ${loser} is attached below the set of ${winner}, which keeps the trees shallow.`,
            state: snapshot(
                `The set of ${loser} is attached below the set of ${winner}.`,
                loser,
                `parent[${loser}] = ${winner}, size[${winner}] = ${before + size[loser]!}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "The forest is flat enough that every element sits one or two steps from its representative.",
        state: snapshot("The partition is maintained.", null, `${count} elements`),
    });

    return events;
}

export const definition: LabDefinition = {
    id: "graphs.dsu",
    title: "Disjoint set union",
    scene: "hybrid",
    description:
        "Keeps a partition of the elements into sets, using path compression inside find and union by size inside unite.",
    maxInputLength: 300,
    presets: [
        {
            id: "merges",
            label: "Three merges",
            input: "5\nunite 0 1\nunite 2 3\nunite 1 3",
        },
        {
            id: "compression",
            label: "A long chain",
            input: "5\nunite 0 1\nunite 1 2\nunite 2 3\nunite 3 4\nfind 4",
        },
        {
            id: "membership",
            label: "Membership queries",
            input: "4\nunite 0 1\nunite 1 2\nsame 0 2\nsame 0 3",
        },
    ],
    notes: [
        "The row of boxes is the parent array: a box holds the representative of that element.",
        "A box marked root is a representative, and the text under it gives the size of its set.",
        "An arrow points from an element to its parent, and the picture flattens as paths are compressed.",
    ],
    build,
};
