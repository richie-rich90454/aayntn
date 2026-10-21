/**
 * Dijkstra's algorithm.
 *
 * The picture is built around the relaxation: when a shorter route to a
 * vertex is found, the tentative distance changes and a new entry is pushed
 * into the priority queue. Stale entries are shown and then discarded, which
 * is the single most common source of confusion when reading this algorithm.
 */
import { circleLayout } from "../core/layout";
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Parsed {
    adjacency: { to: number; weight: number }[][];
    labels: string[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0)
        throw new Error('Provide one line per vertex: "u: v w z" with weights.');

    const adjacency: { to: number; weight: number }[][] = [];
    const labels: string[] = [];
    const pending: { from: number; to: number; weight: number }[] = [];

    const indexOf = (name: string): number => {
        let index = labels.indexOf(name);
        if (index === -1) {
            labels.push(name);
            adjacency.push([]);
            index = labels.length - 1;
        }
        return index;
    };

    for (const line of lines) {
        const [head, ...rest] = line.split(":");
        const name = (head ?? "").trim();
        if (!name) continue;
        const from = indexOf(name);

        // Each neighbour is written as a name followed by its weight, so the
        // tokens are read in pairs: "B 4 C 2" is the neighbour B of weight 4
        // and the neighbour C of weight 2.
        const tokens = rest
            .join(" ")
            .split(/[\s,]+/)
            .filter(Boolean);
        for (let position = 0; position < tokens.length; position += 1) {
            const token = tokens[position]!;
            const match = /^([^\s(]+)\s*\(\s*(-?\d+)\s*\)$/.exec(token);
            if (match) {
                // The name and the weight arrived as one token, as in "B(4)".
                pending.push({
                    from,
                    to: indexOf(match[1]!),
                    weight: Number(match[2]),
                });
                continue;
            }
            const weightToken = tokens[position + 1];
            if (weightToken === undefined || !/^-?\d+$/.test(weightToken)) {
                throw new Error(`Expected "neighbour weight", found "${token}".`);
            }
            pending.push({ from, to: indexOf(token), weight: Number(weightToken) });
            position += 1;
        }
    }

    for (const { from, to, weight } of pending) {
        adjacency[from]!.push({ to, weight });
    }

    return { adjacency, labels };
}

type NodeState = "unvisited" | "discovered" | "active" | "completed";

function build(input: string): LabEvent[] {
    const { adjacency, labels } = parse(input);
    const count = labels.length;
    const positions = circleLayout(count);
    const state: NodeState[] = new Array(count).fill("unvisited");
    const distance: number[] = new Array(count).fill(Number.POSITIVE_INFINITY);
    const heap: { distance: number; vertex: number }[] = [];
    const events: LabEvent[] = [];

    const snapshot = (note: string, formula?: string): LabState => ({
        nodes: labels.map((label, index) => ({
            id: String(index),
            label,
            x: positions[index]!.x,
            y: positions[index]!.y,
            state: state[index],
            value: Number.isFinite(distance[index]) ? `d=${distance[index]}` : "d=∞",
            marker:
                state[index] === "active"
                    ? "active"
                    : state[index] === "completed"
                      ? "final"
                      : state[index] === "discovered"
                        ? "tentative"
                        : undefined,
        })),
        edges: adjacency.flatMap((neighbours, from) =>
            neighbours.map((entry, order) => ({
                from: String(from),
                to: String(entry.to),
                label: String(entry.weight),
                state: state[from] === "active" ? ("active" as const) : ("idle" as const),
                curve:
                    neighbours.length > 1 ? (order - (neighbours.length - 1) / 2) * 26 : undefined,
            })),
        ),
        cells: [],
        structures: [
            {
                id: "pq",
                label: "Priority queue (distance, vertex)",
                kind: "priority-queue",
                orientation: "vertical",
                items: heap.map((entry) => ({
                    value: `(${entry.distance}, ${labels[entry.vertex]})`,
                    state: "highlight" as const,
                })),
            },
        ],
        annotations: [{ x: 30, y: 30, text: note }],
        data: { heap: heap.map((entry) => ({ ...entry })) },
        formula,
    });

    if (count === 0) return events;

    events.push({
        type: "init",
        operation: "init",
        narration: `The graph has ${count} vertices. Every tentative distance is infinite.`,
        state: snapshot("Start: all distances are infinite."),
    });

    const start = 0;
    distance[start] = 0;
    state[start] = "discovered";
    heap.push({ distance: 0, vertex: start });
    events.push({
        type: "push",
        operation: "push-start",
        narration: `Set the distance of the source ${labels[start]} to 0 and push it into the priority queue.`,
        state: snapshot(`Push (0, ${labels[start]}).`, "d(s) = 0"),
    });

    let guard = 0;
    while (heap.length > 0) {
        guard += 1;
        if (guard > 10000) break;

        heap.sort((a, b) => a.distance - b.distance || a.vertex - b.vertex);
        const entry = heap.shift()!;
        const u = entry.vertex;

        if (entry.distance > distance[u]!) {
            events.push({
                type: "pop",
                operation: "discard-stale",
                narration: `Pop (${entry.distance}, ${labels[u]}) but the current best distance to ${labels[u]} is ${distance[u]}. This entry is stale, so discard it.`,
                state: snapshot(`Discard stale (${entry.distance}, ${labels[u]}).`),
            });
            continue;
        }

        state[u] = "active";
        events.push({
            type: "pop",
            operation: "extract-min",
            narration: `Pop the smallest entry (${entry.distance}, ${labels[u]}). No later route can be cheaper, so the distance of ${labels[u]} is now final.`,
            state: snapshot(
                `Extract ${labels[u]} with d = ${distance[u]}.`,
                `d(${labels[u]}) = ${distance[u]}`,
            ),
        });

        for (const { to, weight } of [...adjacency[u]!].sort((a, b) => a.to - b.to)) {
            const candidate = distance[u]! + weight;
            const before = distance[to]!;

            if (candidate < before) {
                distance[to] = candidate;
                state[to] = "discovered";
                heap.push({ distance: candidate, vertex: to });
                events.push({
                    type: "relax",
                    operation: "relax-edge",
                    narration: `d(${labels[u]}) + w = ${distance[u]} + ${weight} = ${candidate} is smaller than the old tentative distance ${Number.isFinite(before) ? before : "∞"} for ${labels[to]}. Update it and push (${candidate}, ${labels[to]}).`,
                    state: snapshot(
                        `Relax ${labels[u]} → ${labels[to]}: ${candidate} < ${Number.isFinite(before) ? before : "∞"}.`,
                        `d(${labels[to]}) ← ${distance[u]} + ${weight} = ${candidate}`,
                    ),
                });
            } else {
                events.push({
                    type: "compare",
                    operation: "reject-relaxation",
                    narration: `d(${labels[u]}) + w = ${candidate} is not smaller than the tentative distance ${Number.isFinite(before) ? before : "∞"} for ${labels[to]}. The edge changes nothing.`,
                    state: snapshot(
                        `Reject ${labels[u]} → ${labels[to]}: ${candidate} ≥ ${Number.isFinite(before) ? before : "∞"}.`,
                        `d(${labels[to]}) stays ${Number.isFinite(before) ? before : "∞"}`,
                    ),
                });
            }
        }

        state[u] = "completed";
        events.push({
            type: "complete",
            operation: "complete-vertex",
            narration: `The distance of ${labels[u]} is final; its outgoing edges have all been relaxed.`,
            state: snapshot(`Finalise ${labels[u]}.`),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration: "The priority queue is empty: every reachable distance is final.",
        state: snapshot("All distances are final."),
    });

    return events;
}

export const definition: LabDefinition = {
    id: "graphs.dijkstra",
    title: "Dijkstra's algorithm",
    scene: "graph",
    description:
        "Single-source shortest paths in a graph whose edge weights are all nonnegative, using a priority queue of tentative distances.",
    maxInputLength: 500,
    presets: [
        {
            id: "classic",
            label: "Classic weighted graph",
            input: "A: B 4 C 2\nB: C 1 D 5\nC: D 8\nD: E 3",
        },
        {
            id: "tie",
            label: "Equal distances",
            input: "A: B 1 C 1\nB: D 1\nC: D 1\nD: E 1",
        },
        {
            id: "chain",
            label: "A chain",
            input: "A: B 7\nB: C 3\nC: D 9\nD: E 2",
        },
    ],
    notes: [
        "A gold vertex is the one being expanded; a green vertex has a final distance.",
        "A blue vertex has only a tentative distance.",
        "A stale entry appears when a vertex is reached twice; it is popped and discarded.",
        "Every edge weight must be nonnegative, otherwise the greedy step is not valid.",
    ],
    build,
};
