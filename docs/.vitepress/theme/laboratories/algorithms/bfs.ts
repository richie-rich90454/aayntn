/**
 * Breadth-first search.
 *
 * The queue is shown explicitly: vertices enter at the back and leave at the
 * front, and the level at which a vertex is discovered is recorded as its
 * distance. The picture makes the level structure visible, which is the
 * reason BFS computes shortest paths in an unweighted graph.
 */
import { circleLayout } from "../core/layout";
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Parsed {
    adjacency: number[][];
    labels: string[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0) throw new Error('Provide one line per vertex: "u: v w z".');

    const adjacency: number[][] = [];
    const labels: string[] = [];
    const pending: { from: number; to: number }[] = [];

    for (const line of lines) {
        const [head, ...rest] = line.split(":");
        const name = (head ?? "").trim();
        if (!name) continue;
        let from = labels.indexOf(name);
        if (from === -1) {
            labels.push(name);
            adjacency.push([]);
            from = labels.length - 1;
        }
        for (const token of rest
            .join(" ")
            .split(/[\s,]+/)
            .filter(Boolean)) {
            let target = labels.indexOf(token);
            if (target === -1) {
                labels.push(token);
                adjacency.push([]);
                target = labels.length - 1;
            }
            pending.push({ from, to: target });
        }
    }

    for (const { from, to } of pending) {
        adjacency[from]!.push(to);
        adjacency[to]!.push(from);
    }

    return { adjacency, labels };
}

type NodeState = "unvisited" | "discovered" | "active" | "completed";

function build(input: string): LabEvent[] {
    const { adjacency, labels } = parse(input);
    const count = labels.length;
    const positions = circleLayout(count);
    const state: NodeState[] = new Array(count).fill("unvisited");
    const distance: number[] = new Array(count).fill(-1);
    const queue: number[] = [];
    const events: LabEvent[] = [];

    const snapshot = (note: string): LabState => ({
        nodes: labels.map((label, index) => ({
            id: String(index),
            label,
            x: positions[index]!.x,
            y: positions[index]!.y,
            state: state[index],
            value: distance[index] >= 0 ? `d=${distance[index]}` : undefined,
            marker:
                state[index] === "active"
                    ? "active"
                    : state[index] === "discovered"
                      ? "queued"
                      : state[index] === "completed"
                        ? "done"
                        : undefined,
        })),
        edges: adjacency.flatMap((neighbours, from) =>
            neighbours.map((to, order) => ({
                from: String(from),
                to: String(to),
                state:
                    distance[from] >= 0 && distance[to] >= 0
                        ? ("done" as const)
                        : ("idle" as const),
                curve:
                    neighbours.length > 1 ? (order - (neighbours.length - 1) / 2) * 26 : undefined,
            })),
        ),
        cells: [],
        structures: [
            {
                id: "queue",
                label: "Queue",
                kind: "queue",
                orientation: "horizontal",
                items: queue.map((vertex) => ({
                    value: labels[vertex]!,
                    state: "highlight" as const,
                })),
            },
        ],
        annotations: [{ x: 30, y: 30, text: note }],
        data: { queue: [...queue] },
        formula: `|queue| = ${queue.length}`,
    });

    if (count === 0) return events;

    events.push({
        type: "init",
        operation: "init",
        narration: "The queue is empty and every vertex is unvisited.",
        state: snapshot("Start."),
    });

    const start = 0;
    queue.push(start);
    state[start] = "discovered";
    distance[start] = 0;
    events.push({
        type: "enqueue",
        operation: "enqueue-start",
        narration: `Enqueue the start vertex ${labels[start]} at distance 0.`,
        state: snapshot(`Enqueue ${labels[start]}.`),
    });

    let guard = 0;
    while (queue.length > 0) {
        guard += 1;
        if (guard > 10000) break;

        const vertex = queue.shift()!;
        state[vertex] = "active";
        events.push({
            type: "dequeue",
            operation: "dequeue",
            narration: `Dequeue ${labels[vertex]}. It sits at distance ${distance[vertex]}.`,
            state: snapshot(`Dequeue ${labels[vertex]}.`),
        });

        for (const neighbour of [...adjacency[vertex]!].sort((a, b) => a - b)) {
            if (distance[neighbour] !== -1) continue;
            distance[neighbour] = distance[vertex]! + 1;
            state[neighbour] = "discovered";
            queue.push(neighbour);
            events.push({
                type: "enqueue",
                operation: "discover-neighbour",
                narration: `${labels[neighbour]} is unvisited, so it is discovered at distance ${distance[neighbour]} and enqueued.`,
                state: snapshot(
                    `Discover ${labels[neighbour]} at distance ${distance[neighbour]}.`,
                ),
            });
        }

        state[vertex] = "completed";
        events.push({
            type: "complete",
            operation: "complete-vertex",
            narration: `All neighbours of ${labels[vertex]} have been examined.`,
            state: snapshot(`Complete ${labels[vertex]}.`),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "The queue is empty: every reachable vertex has been visited at its true distance.",
        state: snapshot("Traversal finished."),
    });

    return events;
}

export const definition: LabDefinition = {
    id: "graphs.bfs",
    title: "Breadth-first search",
    scene: "graph",
    description:
        "Explores the graph level by level using a queue, so the distance recorded at discovery is the true shortest-path distance.",
    maxInputLength: 400,
    presets: [
        { id: "path", label: "A simple path", input: "A: B\nB: C\nC: D" },
        { id: "tree", label: "A branching tree", input: "A: B C\nB: D E\nC: F G" },
        { id: "cycle", label: "With a cycle", input: "A: B\nB: C\nC: A D" },
    ],
    notes: [
        "The number under a vertex is the distance at which it was discovered.",
        "Because the queue is first-in-first-out, vertices are expanded in non-decreasing distance.",
        "That is why BFS gives shortest paths when every edge has the same cost.",
    ],
    build,
};
