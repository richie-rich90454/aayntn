/**
 * Heavy-light decomposition.
 *
 * The reference implementation is the one in the article: a breadth-first
 * walk that fixes the parents and the depths, a pass from the leaves upwards
 * that fixes the subtree sizes and the heavy children, and a flattening that
 * lays the chains out one after another. The picture shows the tree with
 * its heavy edges and the position of every vertex in the flattened array.
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
        if (line.toLowerCase().startsWith("path")) {
            const parts = line.split(/[\s,]+/).filter(Boolean);
            if (parts.length !== 3)
                throw new Error(`A path query needs two vertices, found "${line}".`);
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
    if (order.length !== labels.length)
        throw new Error(
            "The tree must be connected, so that every vertex is reachable from the root.",
        );

    for (const vertex of order) {
        for (const neighbour of adjacency[vertex]!) {
            if (parent[neighbour] === vertex) children[vertex]!.push(neighbour);
        }
    }

    return { labels, children, queries };
}

function build(input: string): LabEvent[] {
    const { labels, children, queries } = parse(input);
    const events: LabEvent[] = [];

    const count = labels.length;
    const parent = new Array<number>(count).fill(0);
    const depth = new Array<number>(count).fill(-1);
    const size = new Array<number>(count).fill(1);
    const heavy = new Array<number>(count).fill(-1);
    const head = new Array<number>(count).fill(0);
    const position = new Array<number>(count).fill(0);
    const positions = treeLayout(children, 0, 720, 380);

    /** The flattened array and its prefix sums. */
    const flat: number[] = [];
    const flatVertices: number[] = [];
    const prefix: number[] = [0];

    /** The value of a vertex is one more than its number in the traversal order. */
    const value = (vertex: number): number => vertex + 1;

    /** The vertices of the path that the current query walks. */
    let active: number[] = [];

    const snapshot = (note: string, formula?: string): LabState => {
        const highlight = new Set(active);
        return {
            nodes: labels.map((label, index) => ({
                id: String(index),
                label,
                x: positions[index]!.x,
                y: positions[index]!.y,
                state: highlight.has(index)
                    ? ("active" as const)
                    : parent[index] === index
                      ? ("completed" as const)
                      : ("unvisited" as const),
                value: `pos ${position[index]}`,
                sublabel: `size ${size[index]}`,
                marker: parent[index] === index ? "root" : undefined,
            })),
            edges: labels.flatMap((_, index) =>
                children[index]!.map((child) => ({
                    from: String(index),
                    to: String(child),
                    directed: true,
                    state: highlight.has(child)
                        ? ("active" as const)
                        : heavy[index] === child
                          ? ("done" as const)
                          : ("idle" as const),
                    marker: heavy[index] === child ? "heavy" : "light",
                })),
            ),
            cells: flat.map((item, index) => ({
                index,
                value: String(item),
                sublabel: labels[flatVertices[index]!],
            })),
            structures: [],
            annotations: [{ x: 30, y: 30, text: note, emphasis: "accent" }],
            data: { size: [...size], heavy: [...heavy], head: [...head], position: [...position] },
            formula,
        };
    };

    events.push({
        type: "init",
        operation: "init",
        narration: `The tree has ${count} vertices and is rooted at ${labels[0]}. Every vertex carries the value one more than its number in the traversal order.`,
        state: snapshot(`The root is ${labels[0]}.`, `depth(${labels[0]}) = 0`),
    });

    // The breadth-first walk fixes the parents and the depths.
    depth[0] = 0;
    const order = [0];
    for (let index = 0; index < order.length; index += 1) {
        const vertex = order[index]!;
        for (const child of children[vertex]!) {
            depth[child] = depth[vertex]! + 1;
            parent[child] = vertex;
            order.push(child);
        }
    }
    for (const vertex of order) {
        active = [vertex];
        events.push({
            type: "build",
            operation: "build",
            narration:
                vertex === 0
                    ? `The root ${labels[0]} has depth 0 and is its own parent.`
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

    // The subtree sizes are known from the leaves upwards.
    for (let index = order.length - 1; index >= 0; index -= 1) {
        const vertex = order[index]!;
        for (const child of children[vertex]!) {
            size[vertex] = size[vertex]! + size[child]!;
        }
        active = [vertex];
        events.push({
            type: "build",
            operation: "compute-subtree-sizes",
            narration: `The subtree of ${labels[vertex]} holds ${size[vertex]} vertices, because every child subtree is counted once.`,
            state: snapshot(
                `The subtree of ${labels[vertex]} holds ${size[vertex]} vertices.`,
                `size(${labels[vertex]}) = ${size[vertex]}`,
            ),
        });
    }
    active = [];

    // The heavy child of a vertex is the child with the largest subtree.
    for (const vertex of order) {
        for (const child of children[vertex]!) {
            if (heavy[vertex] === -1 || size[child]! > size[heavy[vertex]!]!) {
                heavy[vertex] = child;
            }
        }
        if (heavy[vertex] === -1) continue;
        active = [vertex, heavy[vertex]!];
        events.push({
            type: "build",
            operation: "pick-heavy-child",
            narration: `The heavy child of ${labels[vertex]} is ${labels[heavy[vertex]!]}, because its subtree of ${size[heavy[vertex]!]} vertices is the largest.`,
            state: snapshot(
                `The heavy child of ${labels[vertex]} is ${labels[heavy[vertex]!]}.`,
                `heavy(${labels[vertex]}) = ${labels[heavy[vertex]!]}`,
            ),
        });
    }
    active = [];

    // The chains are laid out one after another in the flattened array.
    for (const vertex of order) {
        if (vertex !== 0 && heavy[parent[vertex]!] === vertex) continue;
        const chain: number[] = [];
        for (let walker = vertex; walker !== -1; walker = heavy[walker]!) {
            head[walker] = vertex;
            position[walker] = flat.length;
            flat.push(value(walker));
            flatVertices.push(walker);
            prefix.push(prefix[prefix.length - 1]! + value(walker));
            chain.push(walker);
        }
        active = chain;
        events.push({
            type: "flatten",
            operation: "flatten",
            narration: `The chain ${chain.map((entry) => labels[entry]).join(" -> ")} occupies the positions ${position[chain[0]!]}..${position[chain[chain.length - 1]!]} of the flattened array.`,
            state: snapshot(
                `The chain ${chain.map((entry) => labels[entry]).join(" -> ")} is flattened.`,
                `pos[${labels[chain[0]!]}] = ${position[chain[0]!]}`,
            ),
        });
    }
    active = [];

    for (const query of queries) {
        let u = query.left;
        let v = query.right;
        let total = 0;

        while (head[u]! !== head[v]!) {
            if (depth[head[u]!]! < depth[head[v]!]!) {
                const swap = u;
                u = v;
                v = swap;
            }
            const top = head[u]!;
            const contribution = prefix[position[u]! + 1]! - prefix[position[top]!]!;
            total += contribution;
            active = [u, top];
            events.push({
                type: "query",
                operation: "path-sum",
                narration: `The chain of ${labels[u]} has the head ${labels[top]}, so the segment from ${labels[u]} up to ${labels[top]} is the range ${position[top]}..${position[u]} of the flattened array and contributes ${contribution}.`,
                state: snapshot(
                    `The segment ${labels[top]}..${labels[u]} contributes ${contribution}.`,
                    `prefix[${position[u]! + 1}] - prefix[${position[top]!}] = ${contribution}`,
                ),
            });
            u = parent[top]!;
        }
        active = [];

        if (depth[u]! > depth[v]!) {
            const swap = u;
            u = v;
            v = swap;
        }
        const last = prefix[position[v]! + 1]! - prefix[position[u]!]!;
        total += last;
        active = [u, v];
        events.push({
            type: "query",
            operation: "path-sum",
            narration: `The two vertices share a chain, so the last segment from ${labels[u]} to ${labels[v]} contributes ${last}.`,
            state: snapshot(
                `The segment ${labels[u]}..${labels[v]} contributes ${last}.`,
                `prefix[${position[v]! + 1}] - prefix[${position[u]!}] = ${last}`,
            ),
        });
        active = [];

        events.push({
            type: "finish",
            operation: "path-sum",
            narration: `The path from ${labels[query.left]} to ${labels[query.right]} holds a total value of ${total}.`,
            state: snapshot(
                `The path sum is ${total}.`,
                `pathSum(${labels[query.left]}, ${labels[query.right]}) = ${total}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "Every chain is a contiguous range of the flattened array, so a path query is a few subtractions.",
        state: snapshot("The decomposition is complete.", `${count} vertices`),
    });

    return events;
}

export const hld: LabDefinition = {
    id: "trees.heavy-light-decomposition",
    title: "Heavy-light decomposition",
    scene: "tree",
    description:
        "Splits the tree into chains of heavy edges, flattens them into one array, and answers a path query in a logarithmic number of chain segments.",
    maxInputLength: 400,
    presets: [
        {
            id: "two-chains",
            label: "Two chains",
            input: "A: B C\nB: D E\nC: F\npath D F",
        },
        {
            id: "balanced",
            label: "A balanced tree",
            input: "A: B C\nB: D E\nC: F G\npath E G",
        },
        {
            id: "deep",
            label: "A deep path",
            input: "A: B\nB: C\nC: D\nD: E\npath A E",
        },
    ],
    notes: [
        "A solid edge is a heavy edge, and the child it points to has the largest subtree.",
        "The number under a vertex is its position in the flattened array, and the size is the number of vertices below it.",
        "A path query walks one chain at a time, and every chain segment is an ordinary range of the flattened array.",
    ],
    build,
};
