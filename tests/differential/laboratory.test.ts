/**
 * A differential test compares a demonstration against a simple reference on
 * randomly generated inputs.
 *
 * Passing random tests does not prove correctness, but a disagreement is a
 * counterexample that is worth more than any amount of further reading. The
 * seed is fixed so that a failure can be reproduced exactly.
 *
 * The demonstrations take their own input format, which is simpler than the
 * contest program format: a graph is written one vertex per line, and the
 * binary search takes the sorted values followed by the target.
 */
import { describe, expect, it } from "vitest";
import { definitionFor } from "../../docs/.vitepress/theme/laboratories/algorithms";

/** A small, reproducible generator. */
function makeRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

/**
 * The demonstrations number the vertices in the order in which their names
 * first appear, which is not necessarily the order of the lines. The
 * reference has to use the same numbering, so it is derived from the same
 * lines.
 */
function numberingOf(lines: string[]): Map<string, number> {
    const index = new Map<string, number>();
    const note = (name: string) => {
        if (!index.has(name)) index.set(name, index.size);
    };
    for (const line of lines) {
        const [head, ...rest] = line.split(":");
        note((head ?? "").trim());
        for (const token of rest
            .join(" ")
            .split(/[\s,]+/)
            .filter(Boolean))
            note(token);
    }
    return index;
}

describe("the binary search demonstration agrees with a linear scan", () => {
    it("finds the target whenever a linear scan finds it", () => {
        const random = makeRandom(20261021);
        const definition = definitionFor("searching.binary-search")!;

        for (let trial = 0; trial < 200; trial += 1) {
            const size = 1 + Math.floor(random() * 40);
            const values = Array.from({ length: size }, () => Math.floor(random() * 50)).sort(
                (a, b) => a - b,
            );
            const target =
                random() < 0.5 ? values[Math.floor(random() * size)]! : Math.floor(random() * 60);

            // The demonstration takes the sorted values followed by the target.
            const events = definition.build(`${values.join(" ")} ${target}`);
            const final = events[events.length - 1]!;

            const linear = values.indexOf(target);
            if (linear === -1) {
                expect(final.narration.toLowerCase()).toContain("not in the array");
            } else {
                // The reported index must be one of the positions that hold the target.
                const match = /answer is index (\d+)/.exec(final.narration);
                expect(match, `no index was reported: ${final.narration}`).not.toBeNull();
                const reported = Number(match![1]);
                expect(values[reported]).toBe(target);
            }
        }
    });
});

describe("the depth-first search demonstration reaches exactly the reachable set", () => {
    it("agrees with a breadth-first reference", () => {
        const random = makeRandom(987654321);
        const definition = definitionFor("graphs.dfs")!;

        for (let trial = 0; trial < 60; trial += 1) {
            const count = 2 + Math.floor(random() * 12);
            const names = Array.from({ length: count }, (_, index) => `v${index}`);
            const adjacency: number[][] = Array.from({ length: count }, () => []);
            for (let edge = 0; edge < count * 2; edge += 1) {
                const u = Math.floor(random() * count);
                const v = Math.floor(random() * count);
                if (u === v) continue;
                adjacency[u]!.push(v);
                adjacency[v]!.push(u);
            }

            const lines = adjacency.map(
                (neighbors, index) =>
                    `${names[index]}: ${neighbors.map((n) => names[n]!).join(" ")}`,
            );
            const numbering = numberingOf(lines);
            const byName = new Map(names.map((name, index) => [name, index]));
            void numbering;

            const events = definition.build(lines.join("\n"));
            const final = events[events.length - 1]!;
            const visited = new Set(
                final.state.nodes
                    .filter((node) => node.state === "completed")
                    .map((node) => node.label),
            );

            const reference = new Set<string>();
            const queue = ["v0"];
            while (queue.length) {
                const current = queue.shift()!;
                if (reference.has(current)) continue;
                reference.add(current);
                for (const neighbor of adjacency[byName.get(current)!]!) {
                    queue.push(names[neighbor]!);
                }
            }

            expect([...visited].sort()).toEqual([...reference].sort());
        }
    });
});

describe("the breadth-first search demonstration records the true distances", () => {
    it("agrees with a reference breadth-first search", () => {
        const random = makeRandom(13572468);
        const definition = definitionFor("graphs.bfs")!;

        for (let trial = 0; trial < 60; trial += 1) {
            const count = 2 + Math.floor(random() * 12);
            const names = Array.from({ length: count }, (_, index) => `v${index}`);
            const adjacency: number[][] = Array.from({ length: count }, () => []);
            for (let edge = 0; edge < count; edge += 1) {
                const u = Math.floor(random() * count);
                const v = Math.floor(random() * count);
                if (u === v) continue;
                adjacency[u]!.push(v);
                adjacency[v]!.push(u);
            }

            const lines = adjacency.map(
                (neighbors, index) =>
                    `${names[index]}: ${neighbors.map((n) => names[n]!).join(" ")}`,
            );
            const numbering = numberingOf(lines);
            const byName = new Map(names.map((name, index) => [name, index]));
            void numbering;

            const events = definition.build(lines.join("\n"));
            const final = events[events.length - 1]!;

            const reference = new Array<number>(count).fill(-1);
            reference[byName.get("v0")!] = 0;
            const queue = [byName.get("v0")!];
            while (queue.length) {
                const current = queue.shift()!;
                for (const neighbor of adjacency[current]!) {
                    if (reference[neighbor] !== -1) continue;
                    reference[neighbor] = reference[current]! + 1;
                    queue.push(neighbor);
                }
            }

            for (const node of final.state.nodes) {
                const reported = node.value ? Number(node.value.replace("d=", "")) : -1;
                const name = node.label;
                expect(reported, `vertex ${name}`).toBe(reference[byName.get(name)!]);
            }
        }
    });
});

describe("the Dijkstra demonstration agrees with a reference shortest path", () => {
    it("agrees with Bellman-Ford on a graph with nonnegative weights", () => {
        const random = makeRandom(24681357);
        const definition = definitionFor("graphs.dijkstra")!;

        for (let trial = 0; trial < 40; trial += 1) {
            const count = 2 + Math.floor(random() * 10);
            const names = Array.from({ length: count }, (_, index) => `v${index}`);
            const adjacency: { to: number; weight: number }[][] = Array.from(
                { length: count },
                () => [],
            );
            const lines: string[] = [];
            for (let index = 0; index < count; index += 1) {
                const neighbors: string[] = [];
                for (let edge = 0; edge < 3; edge += 1) {
                    const to = Math.floor(random() * count);
                    const weight = Math.floor(random() * 10);
                    if (to === index) continue;
                    adjacency[index]!.push({ to, weight });
                    neighbors.push(`${names[to]} ${weight}`);
                }
                lines.push(`${names[index]}: ${neighbors.join(" ")}`);
            }

            const numbering = numberingOf(lines);
            const byName = new Map(names.map((name, index) => [name, index]));
            const start = byName.get("v0")!;

            const events = definition.build(lines.join("\n"));
            const final = events[events.length - 1]!;

            // Bellman-Ford over the directed version of the same graph.
            const reference = new Array<number>(count).fill(Number.POSITIVE_INFINITY);
            reference[start] = 0;
            for (let pass = 0; pass < count; pass += 1) {
                for (let from = 0; from < count; from += 1) {
                    for (const { to, weight } of adjacency[from]!) {
                        if (reference[from]! + weight < reference[to]!) {
                            reference[to] = reference[from]! + weight;
                        }
                    }
                }
            }

            for (const node of final.state.nodes) {
                const reported =
                    node.value === "d=∞"
                        ? Number.POSITIVE_INFINITY
                        : Number(node.value!.replace("d=", ""));
                const name = node.label;
                expect(reported, `vertex ${name}`).toBe(reference[byName.get(name)!]);
            }
        }
    });
});
