/**
 * Depth-first search.
 *
 * The reference implementation is the iterative one: an explicit stack of
 * vertices, marked when popped rather than when pushed. That choice matters
 * pedagogically — it is exactly why the auxiliary space of this variant is
 * O(V + E) rather than O(V) — and the animation shows the stack growing and
 * shrinking.
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
        const from = labels.indexOf(name);
        const index = from === -1 ? labels.length : from;
        if (from === -1) {
            labels.push(name);
            adjacency.push([]);
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
            pending.push({ from: index, to: target });
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
    const stack: number[] = [];
    const events: LabEvent[] = [];

    const snapshot = (note: string): LabState => ({
        nodes: labels.map((label, index) => ({
            id: String(index),
            label,
            x: positions[index]!.x,
            y: positions[index]!.y,
            state: state[index],
            marker:
                state[index] === "active"
                    ? "active"
                    : state[index] === "discovered"
                      ? "frontier"
                      : state[index] === "completed"
                        ? "done"
                        : undefined,
        })),
        edges: adjacency.flatMap((neighbours, from) =>
            neighbours.map((to, order) => ({
                from: String(from),
                to: String(to),
                directed: false,
                state:
                    state[from] === "completed" && state[to] !== "unvisited"
                        ? ("done" as const)
                        : ("idle" as const),
                curve:
                    neighbours.length > 1 ? (order - (neighbours.length - 1) / 2) * 26 : undefined,
            })),
        ),
        cells: [],
        structures: [
            {
                id: "stack",
                label: "Explicit stack",
                kind: "stack",
                orientation: "vertical",
                items: stack
                    .slice()
                    .reverse()
                    .map((vertex) => ({ value: labels[vertex]!, state: "highlight" as const })),
            },
        ],
        annotations: [{ x: 30, y: 30, text: note }],
        data: { stack: [...stack] },
        formula: `|stack| = ${stack.length}`,
    });

    events.push({
        type: "init",
        operation: "init",
        narration: `The graph has ${count} vertices. The explicit stack is empty.`,
        state: snapshot("Start: the stack is empty."),
    });

    let current = 0;
    if (count === 0) return events;

    stack.push(current);
    events.push({
        type: "push",
        operation: "push-start",
        narration: `Push the start vertex ${labels[current]}.`,
        state: snapshot(`Push ${labels[current]}.`),
    });

    let guard = 0;
    while (stack.length > 0) {
        guard += 1;
        if (guard > 10000) break;

        const vertex = stack.pop()!;

        if (state[vertex] === "completed") {
            events.push({
                type: "pop",
                operation: "skip-visited",
                narration: `Pop ${labels[vertex]}; it has already been visited, so skip it.`,
                state: snapshot(`Pop ${labels[vertex]} (already visited).`),
            });
            continue;
        }

        state[vertex] = "active";
        events.push({
            type: "visit",
            operation: "visit-vertex",
            narration: `Pop ${labels[vertex]} and mark it discovered. It is now the active vertex.`,
            state: snapshot(`Visit ${labels[vertex]}.`),
        });

        const neighbours = [...adjacency[vertex]!].sort((a, b) => a - b);
        for (const neighbour of neighbours) {
            if (state[neighbour] === "unvisited") {
                state[neighbour] = "discovered";
                stack.push(neighbour);
                events.push({
                    type: "push",
                    operation: "push-neighbour",
                    narration: `Push the unvisited neighbour ${labels[neighbour]}.`,
                    state: snapshot(`Push ${labels[neighbour]}.`),
                });
            }
        }

        state[vertex] = "completed";
        events.push({
            type: "complete",
            operation: "complete-vertex",
            narration: `All neighbours of ${labels[vertex]} have been considered, so the traversal backtracks.`,
            state: snapshot(`Complete ${labels[vertex]}.`),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration: "The stack is empty: every reachable vertex has been visited.",
        state: snapshot("Traversal finished."),
    });

    return events;
}

export const definition: LabDefinition = {
    id: "graphs.dfs",
    title: "Depth-first search",
    scene: "graph",
    description:
        "Explores as far as possible along each branch before backtracking, using an explicit stack.",
    maxInputLength: 400,
    presets: [
        {
            id: "path",
            label: "A simple path",
            input: "A: B\nB: C\nC: D\nD: E",
        },
        {
            id: "cycle",
            label: "With a cycle",
            input: "A: B D\nB: C\nC: D\nD: B",
        },
        {
            id: "star",
            label: "A star",
            input: "A: B C D\nB: E\nC: F\nD: G",
        },
    ],
    notes: [
        "Gold marks the active vertex; green marks a vertex whose neighbours are done.",
        "Blue marks a vertex that has been discovered but not yet expanded.",
        "The stack shows which vertex will be expanded next.",
    ],
    build,
};
