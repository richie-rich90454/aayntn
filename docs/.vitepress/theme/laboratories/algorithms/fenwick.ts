/**
 * The Fenwick tree.
 *
 * The reference implementation is the one in the article: a one-indexed array
 * in which `tree[i]` holds the sum of the block that ends at `i`, an update
 * that walks up by the lowest set bit, and a prefix sum that walks down by
 * it. The picture shows the blocks as a forest, because the block that ends
 * at `i` sits inside the block that ends at `i - lowbit(i)`.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Operation {
    kind: "add" | "prefix" | "range";
    index: number;
    delta?: number;
    right?: number;
}

interface Parsed {
    count: number;
    values: number[];
    operations: Operation[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) throw new Error("Provide the length of the array on the first line.");
    const head = lines[0]!.split(/[\s,]+/).filter(Boolean);
    if (head.length !== 1) throw new Error("The first line must hold the length only.");
    const count = Number(head[0]);
    if (!Number.isInteger(count) || count < 1)
        throw new Error("The length of the array must be a positive integer.");

    if (lines.length < 2) throw new Error("Provide the values of the array on the second line.");
    const tokens = lines[1]!.split(/[\s,]+/).filter(Boolean);
    if (tokens.length !== count)
        throw new Error(`The second line must hold ${count} values, found ${tokens.length}.`);
    const values = tokens.map(Number);
    if (values.some((value) => Number.isNaN(value)))
        throw new Error("Array entries must be numbers.");

    const position = (token: string): number => {
        const value = Number(token);
        if (!Number.isInteger(value) || value < 1 || value > count)
            throw new Error(`The position ${token} is outside the range 1..${count}.`);
        return value;
    };

    const operations: Operation[] = [];
    for (const line of lines.slice(2)) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        const kind = parts[0];
        if (kind === "add") {
            if (parts.length !== 3)
                throw new Error(`"add" needs a position and a delta, found "${line}".`);
            const delta = Number(parts[2]);
            if (!Number.isInteger(delta)) throw new Error("The delta must be an integer.");
            operations.push({ kind, index: position(parts[1]!), delta });
        } else if (kind === "prefix") {
            if (parts.length !== 2)
                throw new Error(`"prefix" needs one position, found "${line}".`);
            operations.push({ kind, index: position(parts[1]!) });
        } else if (kind === "range") {
            if (parts.length !== 3)
                throw new Error(`"range" needs two positions, found "${line}".`);
            const left = position(parts[1]!);
            const right = position(parts[2]!);
            if (left > right) throw new Error(`The range ${left}..${right} is empty.`);
            operations.push({ kind, index: left, right });
        } else {
            throw new Error(`Unknown operation "${kind ?? ""}": use add, prefix or range.`);
        }
    }
    return { count, values, operations };
}

const lowbit = (index: number): number => index & -index;

/**
 * The blocks are drawn in rows: every block that has no parent sits on the
 * top row, the blocks it contains one row below, and so on.
 */
function layoutBlocks(count: number): Map<number, { x: number; y: number }> {
    const children: number[][] = Array.from({ length: count + 1 }, () => []);
    const roots: number[] = [];
    for (let index = 1; index <= count; index += 1) {
        const parent = index - lowbit(index);
        if (parent === 0) roots.push(index);
        else children[parent]!.push(index);
    }

    const depth = new Array<number>(count + 1).fill(0);
    let maxDepth = 0;
    for (const root of roots) {
        const queue: number[] = [root];
        let level = 0;
        while (queue.length) {
            const next: number[] = [];
            for (const vertex of queue) {
                depth[vertex] = level;
                if (level > maxDepth) maxDepth = level;
                next.push(...children[vertex]!);
            }
            queue.length = 0;
            queue.push(...next);
            level += 1;
        }
    }

    const levels: number[][] = [];
    for (let index = 1; index <= count; index += 1) {
        const level = depth[index]!;
        if (!levels[level]) levels[level] = [];
        levels[level]!.push(index);
    }

    const positions = new Map<number, { x: number; y: number }>();
    const rowHeight = Math.min(75, 240 / Math.max(1, maxDepth));
    levels.forEach((level, index) => {
        const spacing = 700 / (level.length + 1);
        level.forEach((block, order) => {
            positions.set(block, {
                x: Math.round(spacing * (order + 1)),
                y: Math.round(160 + index * rowHeight),
            });
        });
    });
    return positions;
}

function build(input: string): LabEvent[] {
    const { count, values, operations } = parse(input);
    const events: LabEvent[] = [];

    const data: number[] = new Array<number>(count + 1).fill(0);
    const tree: number[] = new Array<number>(count + 1).fill(0);
    const positions = layoutBlocks(count);

    /** The blocks that the current operation touches. */
    let touched: number[] = [];

    const snapshot = (note: string, formula?: string): LabState => {
        const highlight = new Set(touched);
        return {
            nodes: Array.from({ length: count }, (_, index) => {
                const block = index + 1;
                return {
                    id: String(block),
                    label: String(block),
                    x: positions.get(block)?.x ?? 0,
                    y: positions.get(block)?.y ?? 0,
                    state: highlight.has(block) ? ("active" as const) : ("unvisited" as const),
                    value: String(tree[block]!),
                    sublabel: `covers ${block - lowbit(block) + 1}..${block}`,
                    marker: highlight.has(block) ? "touched" : undefined,
                };
            }),
            edges: Array.from({ length: count }, (_, index) => {
                const block = index + 1;
                const parent = block - lowbit(block);
                return {
                    from: String(parent),
                    to: String(block),
                    directed: true,
                    state: highlight.has(block) ? ("active" as const) : ("tree" as const),
                };
            }).filter((edge) => edge.from !== "0"),
            cells: Array.from({ length: count }, (_, index) => ({
                index,
                value: String(data[index + 1]!),
                state: "idle" as const,
                sublabel: `a${index + 1}`,
            })),
            structures: [],
            annotations: [{ x: 90, y: 30, text: note, emphasis: "accent" }],
            data: { data: [...data], tree: [...tree] },
            formula,
        };
    };

    events.push({
        type: "init",
        operation: "init",
        narration: `The array has ${count} positions and the tree starts empty, so every block sum is zero.`,
        state: snapshot("Every block is empty.", "tree[i] = 0"),
    });

    const insert = (index: number, delta: number, building: boolean): void => {
        const visited: number[] = [];
        for (let block = index; block <= count; block += lowbit(block)) {
            visited.push(block);
            tree[block] = tree[block]! + delta;
        }
        touched = visited;
        events.push({
            type: "add",
            operation: "add",
            narration: building
                ? `The value ${delta} at position ${index} is inserted, so the blocks ${visited.join(", ")} rise by ${delta}.`
                : `Adding ${delta} at position ${index} raises the blocks ${visited.join(", ")}, because those are the blocks that contain the position.`,
            state: snapshot(
                `The blocks ${visited.join(", ")} hold the position ${index}.`,
                `the blocks ${visited.join(", ")} each rise by ${delta}`,
            ),
        });
        touched = [];
    };

    values.forEach((value, index) => {
        data[index + 1] = value;
        insert(index + 1, value, true);
    });

    const prefixWalk = (index: number): number => {
        let total = 0;
        const visited: number[] = [];
        for (let block = index; block > 0; block -= lowbit(block)) {
            visited.push(block);
            total += tree[block]!;
            touched = visited;
            events.push({
                type: "prefix",
                operation: "prefix-sum",
                narration: `The block ${block} covers the positions ${block - lowbit(block) + 1}..${block} and holds ${tree[block]}, so the running total becomes ${total}.`,
                state: snapshot(
                    `The blocks ${visited.join(", ")} tile the prefix without overlap.`,
                    `prefix(${index}) = ${total} so far`,
                ),
            });
        }
        touched = [];
        return total;
    };

    for (const operation of operations) {
        if (operation.kind === "add") {
            data[operation.index] = data[operation.index]! + operation.delta!;
            insert(operation.index, operation.delta!, false);
            continue;
        }

        if (operation.kind === "prefix") {
            const total = prefixWalk(operation.index);
            events.push({
                type: "query",
                operation: "prefix-sum",
                narration: `The sum of the first ${operation.index} positions is ${total}.`,
                state: snapshot(
                    `The prefix sum of the first ${operation.index} positions is ${total}.`,
                    `prefix(${operation.index}) = ${total}`,
                ),
            });
            continue;
        }

        const right = prefixWalk(operation.right!);
        const left = prefixWalk(operation.index - 1);
        events.push({
            type: "query",
            operation: "range-sum",
            narration: `The sum of the range ${operation.index}..${operation.right} is ${right} - ${left} = ${right - left}.`,
            state: snapshot(
                `The range sum is the difference of the two prefix sums.`,
                `range(${operation.index}, ${operation.right}) = ${right} - ${left} = ${right - left}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "Every block sum agrees with the array, so a prefix sum is a walk of logarithmic length.",
        state: snapshot("The tree is consistent.", `${count} positions`),
    });

    return events;
}

export const fenwick: LabDefinition = {
    id: "range-queries.fenwick-tree",
    title: "Fenwick tree",
    scene: "hybrid",
    description:
        "Keeps the block sums of an array in a binary indexed tree, so that a point update and a prefix sum both cost logarithmic time.",
    maxInputLength: 300,
    presets: [
        {
            id: "simple",
            label: "A build and a query",
            input: "5\n1 2 3 4 5\nprefix 4",
        },
        {
            id: "update",
            label: "A point update",
            input: "5\n1 2 3 4 5\nadd 3 10\nprefix 4",
        },
        {
            id: "range",
            label: "A range query",
            input: "6\n2 4 6 8 10 12\nrange 2 5",
        },
    ],
    notes: [
        "The row of boxes is the array, and each box above it is a block of the tree.",
        "The number inside a box is the sum of the block, and the text under it names the positions the block covers.",
        "An update touches the blocks that contain the position, and a prefix sum walks the blocks that tile the prefix.",
    ],
    build,
};
