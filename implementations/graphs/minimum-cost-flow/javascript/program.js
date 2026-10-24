// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Minimum-cost maximum flow in a directed network read from standard input.
 *
 * Input: n m s t, then m lines u v capacity cost (0-based, directed).
 * Output: the maximum flow and the minimum cost of that flow, using successive
 * shortest paths with potentials and lazy deletion in the binary heap.
 */

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 4) {
        return;
    }
    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    const s = Number(tokens[2]);
    const t = Number(tokens[3]);
    if (n <= 0 || s < 0 || s >= n || t < 0 || t >= n || s === t) {
        process.stdout.write("0 0\n");
        return;
    }

    const graph = Array.from({ length: n }, () => []);
    let index = 4;
    for (let e = 0; e < m; e += 1) {
        if (index + 3 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        const capacity = Number(tokens[index + 2]);
        const cost = Number(tokens[index + 3]);
        index += 4;
        if (u < 0 || u >= n || v < 0 || v >= n || capacity < 0) {
            continue;
        }
        graph[u].push({ to: v, rev: graph[v].length, cap: capacity, cost });
        graph[v].push({ to: u, rev: graph[u].length - 1, cap: 0, cost: -cost });
    }

    const height = new Array(n).fill(0);
    let flow = 0;
    let total = 0;

    const keys = [];
    const vertices = [];

    const push = (key, vertex) => {
        let spot = keys.length;
        keys.push(key);
        vertices.push(vertex);
        while (spot > 0) {
            const parent = Math.floor((spot - 1) / 2);
            if (keys[parent] <= key) {
                break;
            }
            keys[spot] = keys[parent];
            vertices[spot] = vertices[parent];
            spot = parent;
        }
        keys[spot] = key;
        vertices[spot] = vertex;
    };

    const pop = () => {
        const topKey = keys[0];
        const topVertex = vertices[0];
        const lastKey = keys.pop();
        const lastVertex = vertices.pop();
        if (keys.length > 0) {
            let spot = 0;
            for (;;) {
                const left = 2 * spot + 1;
                if (left >= keys.length) {
                    break;
                }
                const right = left + 1;
                const child = right < keys.length && keys[right] < keys[left] ? right : left;
                if (keys[child] >= lastKey) {
                    break;
                }
                keys[spot] = keys[child];
                vertices[spot] = vertices[child];
                spot = child;
            }
            keys[spot] = lastKey;
            vertices[spot] = lastVertex;
        }
        return [topKey, topVertex];
    };

    while (true) {
        const distance = new Array(n).fill(Number.POSITIVE_INFINITY);
        const previousVertex = new Array(n).fill(-1);
        const previousEdge = new Array(n).fill(-1);
        distance[s] = 0;
        keys.length = 0;
        vertices.length = 0;
        push(0, s);
        while (keys.length > 0) {
            const [current, v] = pop();
            if (current !== distance[v]) {
                continue;
            }
            for (let i = 0; i < graph[v].length; i += 1) {
                const edge = graph[v][i];
                if (edge.cap <= 0) {
                    continue;
                }
                // The reduced cost is nonnegative while the potentials are feasible.
                const candidate = current + edge.cost + height[v] - height[edge.to];
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                    previousVertex[edge.to] = v;
                    previousEdge[edge.to] = i;
                    push(candidate, edge.to);
                }
            }
        }
        if (distance[t] === Number.POSITIVE_INFINITY) {
            break;
        }
        for (let v = 0; v < n; v += 1) {
            if (distance[v] < Number.POSITIVE_INFINITY) {
                height[v] += distance[v];
            }
        }

        let add = Number.POSITIVE_INFINITY;
        for (let v = t; v !== s; v = previousVertex[v]) {
            add = Math.min(add, graph[previousVertex[v]][previousEdge[v]].cap);
        }
        for (let v = t; v !== s; v = previousVertex[v]) {
            const edge = graph[previousVertex[v]][previousEdge[v]];
            edge.cap -= add;
            graph[edge.to][edge.rev].cap += add;
        }
        flow += add;
        total += add * (height[t] - height[s]);
    }

    process.stdout.write(`${flow} ${total}\n`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
