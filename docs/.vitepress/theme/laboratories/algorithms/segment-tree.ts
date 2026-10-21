/**
 * The segment tree.
 *
 * The reference implementation is the one in the article: a binary tree over
 * the array in which every node caches the sum of the range it covers. The
 * picture shows the array along the top and the tree below it, so that a
 * query is the set of nodes that cover the range and an update is the path
 * from the root to the leaf.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Operation {
    kind: "set" | "range";
    index: number;
    value?: number;
    right?: number;
}

interface Parsed {
    values: number[];
    operations: Operation[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2)
        throw new Error(
            "Provide the length of the array on the first line and the values on the second.",
        );
    const head = lines[0]!.split(/[\s,]+/).filter(Boolean);
    if (head.length !== 1) throw new Error("The first line must hold the length only.");
    const count = Number(head[0]);
    if (!Number.isInteger(count) || count < 1)
        throw new Error("The length of the array must be a positive integer.");

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
        if (kind === "set") {
            if (parts.length !== 3)
                throw new Error(`"set" needs a position and a value, found "${line}".`);
            const value = Number(parts[2]);
            if (!Number.isInteger(value)) throw new Error("The new value must be an integer.");
            operations.push({ kind, index: position(parts[1]!), value });
        } else if (kind === "range") {
            if (parts.length !== 3)
                throw new Error(`"range" needs two positions, found "${line}".`);
            const left = position(parts[1]!);
            const right = position(parts[2]!);
            if (left > right) throw new Error(`The range ${left}..${right} is empty.`);
            operations.push({ kind, index: left, right });
        } else {
            throw new Error(`Unknown operation "${kind ?? ""}": use set or range.`);
        }
    }
    return { values, operations };
}

interface Node {
    index: number;
    low: number;
    high: number;
}

interface Point {
    x: number;
    y: number;
}

function buildNodes(count: number): Node[] {
    const nodes: Node[] = [];
    const walk = (index: number, low: number, high: number): void => {
        nodes.push({ index, low, high });
        if (low === high) return;
        const mid = low + Math.floor((high - low) / 2);
        walk(index * 2, low, mid);
        walk(index * 2 + 1, mid + 1, high);
    };
    walk(1, 1, count);
    return nodes;
}

/** The tree is drawn in rows: the root on top, the leaves at the bottom. */
function layoutTree(children: Map<number, number[]>, root: number): Map<number, Point> {
    const positions = new Map<number, Point>();
    const levels: number[][] = [[root]];
    for (let level = 0; level < levels.length; level += 1) {
        for (const vertex of levels[level]!) {
            for (const child of children.get(vertex) ?? []) {
                if (!levels[level + 1]) levels[level + 1] = [];
                levels[level + 1]!.push(child);
            }
        }
    }
    levels.forEach((level, index) => {
        const spacing = 700 / (level.length + 1);
        level.forEach((vertex, order) => {
            positions.set(vertex, {
                x: Math.round(spacing * (order + 1)),
                y: Math.round(50 + index * 60),
            });
        });
    });
    return positions;
}

function build(input: string): LabEvent[] {
    const { values, operations } = parse(input);
    const events: LabEvent[] = [];

    const count = values.length;
    const nodes = buildNodes(count);
    const children = new Map<number, number[]>();
    for (const node of nodes) {
        if (node.low === node.high) continue;
        children.set(node.index, [node.index * 2, node.index * 2 + 1]);
    }
    const positions = layoutTree(children, 1);

    const tree = new Map<number, number>();
    const data = values.slice();

    /** The nodes that the current operation touches. */
    let touched: number[] = [];

    const snapshot = (note: string, formula?: string): LabState => {
        const highlight = new Set(touched);
        return {
            nodes: nodes.map((node) => ({
                id: String(node.index),
                label: String(node.index),
                x: positions.get(node.index)?.x ?? 0,
                y: (positions.get(node.index)?.y ?? 0) + 120,
                state: highlight.has(node.index) ? ("active" as const) : ("unvisited" as const),
                value: String(tree.get(node.index) ?? 0),
                sublabel: `${node.low}..${node.high}`,
            })),
            edges: nodes.flatMap((node) =>
                (children.get(node.index) ?? []).map((child) => ({
                    from: String(node.index),
                    to: String(child),
                    directed: true,
                    state: highlight.has(child) ? ("active" as const) : ("tree" as const),
                })),
            ),
            cells: data.map((value, index) => ({
                index,
                value: String(value),
                state: "idle" as const,
                sublabel: `a${index + 1}`,
            })),
            structures: [],
            annotations: [{ x: 90, y: 30, text: note, emphasis: "accent" }],
            data: { tree: [...tree.entries()] },
            formula,
        };
    };

    events.push({
        type: "init",
        operation: "init",
        narration: `The array has ${count} positions and the tree has not been built yet.`,
        state: snapshot("The tree is empty.", `${count} positions`),
    });

    const buildNode = (node: Node): void => {
        if (node.low === node.high) {
            tree.set(node.index, data[node.low - 1]!);
            touched = [node.index];
            events.push({
                type: "build",
                operation: "build",
                narration: `The leaf that covers position ${node.low} holds the value ${data[node.low - 1]}.`,
                state: snapshot(
                    `The leaf for position ${node.low} holds ${data[node.low - 1]}.`,
                    `tree[${node.index}] = ${data[node.low - 1]}`,
                ),
            });
            touched = [];
            return;
        }
        const mid = node.low + Math.floor((node.high - node.low) / 2);
        const left = nodes.find((entry) => entry.index === node.index * 2)!;
        const right = nodes.find((entry) => entry.index === node.index * 2 + 1)!;
        buildNode(left);
        buildNode(right);
        const total = (tree.get(left.index) ?? 0) + (tree.get(right.index) ?? 0);
        tree.set(node.index, total);
        touched = [node.index];
        events.push({
            type: "build",
            operation: "build",
            narration: `The node that covers ${node.low}..${node.high} merges its two children and holds ${total}.`,
            state: snapshot(
                `The node for ${node.low}..${node.high} holds ${total}.`,
                `tree[${node.index}] = ${tree.get(left.index) ?? 0} + ${tree.get(right.index) ?? 0} = ${total}`,
            ),
        });
        touched = [];
    };

    buildNode(nodes[0]!);

    const assign = (node: Node, index: number, value: number): void => {
        if (node.low === node.high) {
            tree.set(node.index, value);
            data[node.low - 1] = value;
            touched = [node.index];
            events.push({
                type: "update",
                operation: "point-update",
                narration: `The leaf that covers position ${node.low} now holds ${value}.`,
                state: snapshot(
                    `The leaf for position ${node.low} holds ${value}.`,
                    `tree[${node.index}] = ${value}`,
                ),
            });
            touched = [];
            return;
        }
        const mid = node.low + Math.floor((node.high - node.low) / 2);
        const child = nodes.find(
            (entry) => entry.index === (index <= mid ? node.index * 2 : node.index * 2 + 1),
        )!;
        touched = [node.index, child.index];
        events.push({
            type: "update",
            operation: "point-update",
            narration: `Position ${index} lies in ${child.low}..${child.high}, so the update descends into that child.`,
            state: snapshot(
                `The update descends into ${child.low}..${child.high}.`,
                `tree[${child.index}] is recomputed`,
            ),
        });
        touched = [];
        assign(child, index, value);
        const total = (tree.get(node.index * 2) ?? 0) + (tree.get(node.index * 2 + 1) ?? 0);
        tree.set(node.index, total);
        touched = [node.index];
        events.push({
            type: "update",
            operation: "point-update",
            narration: `The node that covers ${node.low}..${node.high} merges its two children again and holds ${total}.`,
            state: snapshot(
                `The node for ${node.low}..${node.high} holds ${total}.`,
                `tree[${node.index}] = ${total}`,
            ),
        });
        touched = [];
    };

    const query = (node: Node, left: number, right: number): number => {
        if (right < node.low || node.high < left) {
            touched = [node.index];
            events.push({
                type: "query",
                operation: "range-query",
                narration: `The node that covers ${node.low}..${node.high} does not overlap the query, so it contributes nothing.`,
                state: snapshot(`${node.low}..${node.high} is outside the query.`, "contributes 0"),
            });
            touched = [];
            return 0;
        }
        if (left <= node.low && node.high <= right) {
            const total = tree.get(node.index) ?? 0;
            touched = [node.index];
            events.push({
                type: "query",
                operation: "range-query",
                narration: `The node that covers ${node.low}..${node.high} lies inside the query, so its cached sum ${total} is taken.`,
                state: snapshot(
                    `${node.low}..${node.high} is inside the query.`,
                    `contributes ${total}`,
                ),
            });
            touched = [];
            return total;
        }
        const mid = node.low + Math.floor((node.high - node.low) / 2);
        const leftChild = nodes.find((entry) => entry.index === node.index * 2)!;
        const rightChild = nodes.find((entry) => entry.index === node.index * 2 + 1)!;
        touched = [node.index];
        events.push({
            type: "query",
            operation: "range-query",
            narration: `The node that covers ${node.low}..${node.high} only partly overlaps the query, so it is split into ${leftChild.low}..${leftChild.high} and ${rightChild.low}..${rightChild.high}.`,
            state: snapshot(
                `${node.low}..${node.high} is split into two children.`,
                "the node is split",
            ),
        });
        touched = [];
        return query(leftChild, left, right) + query(rightChild, left, right);
    };

    for (const operation of operations) {
        if (operation.kind === "set") {
            const node = nodes.find(
                (entry) => entry.low <= operation.index && operation.index <= entry.high,
            )!;
            assign(node, operation.index, operation.value!);
            continue;
        }

        const node = nodes[0]!;
        const total = query(node, operation.index, operation.right!);
        events.push({
            type: "query",
            operation: "range-query",
            narration: `The sum of the range ${operation.index}..${operation.right} is ${total}.`,
            state: snapshot(
                `The sum of ${operation.index}..${operation.right} is ${total}.`,
                `range(${operation.index}, ${operation.right}) = ${total}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "Every node still holds the sum of the range it covers, so a range sum costs logarithmic time.",
        state: snapshot("The tree is consistent.", `${nodes.length} nodes`),
    });

    return events;
}

export const segmentTree: LabDefinition = {
    id: "range-queries.segment-tree",
    title: "Segment tree",
    scene: "hybrid",
    description:
        "Caches the sum of every range in a binary tree over the array, so that a point assignment and a range sum both cost logarithmic time.",
    maxInputLength: 300,
    presets: [
        {
            id: "build",
            label: "A build and a query",
            input: "5\n1 2 3 4 5\nrange 2 4",
        },
        {
            id: "update",
            label: "A point assignment",
            input: "5\n1 2 3 4 5\nset 3 30\nrange 3 5",
        },
        {
            id: "whole",
            label: "The whole array",
            input: "6\n4 1 7 3 9 2\nrange 1 6",
        },
    ],
    notes: [
        "The row of boxes is the array, and the tree underneath it caches the sum of every range.",
        "The number inside a node is the cached sum, and the text under it names the positions the node covers.",
        "A query takes whole nodes where it can and splits the rest, while an update walks the path to one leaf.",
    ],
    build,
};
