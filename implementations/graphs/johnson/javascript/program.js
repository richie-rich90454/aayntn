"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission language.
 *
 * Johnson's algorithm over a directed weighted graph read from standard input.
 *
 * Input: n m, then m lines u v w (0-based, directed, integer weight). The
 * input ends after the edges.
 * Output: n lines of n integers, where the j-th number of the i-th line is the
 * shortest distance from i to j, and -1 when j is unreachable from i. A graph
 * with a negative cycle prints the single line "NEGATIVE CYCLE" instead.
 */

/**
 * @param {number} n the number of vertices
 * @param {number[][]} edges the directed edges as [from, to, weight]
 * @returns {number[] | null} the potentials, or null on a negative cycle
 */
function findPotentials(n, edges) {
    /*
     * Every vertex starts at zero, as if a virtual source were joined to it by
     * an edge of weight zero. n relaxation passes then either produce the
     * potentials or expose a negative cycle.
     */
    const height = new Array(n).fill(0);
    for (let pass = 0; pass < n; pass += 1) {
        let changed = false;
        for (const [u, v, w] of edges) {
            const candidate = height[u] + w;
            if (candidate < height[v]) {
                height[v] = candidate;
                changed = true;
            }
        }
        if (!changed) {
            return height;
        }
        if (pass === n - 1) {
            return null;
        }
    }
    return height;
}

/**
 * @param {number} n the number of vertices
 * @param {number[][][]} adjacency the reweighted adjacency list
 * @param {number} source the start vertex
 * @returns {number[]} the reweighted distance to every vertex
 */
function dijkstra(n, adjacency, source) {
    const distance = new Array(n).fill(Number.POSITIVE_INFINITY);
    const keys = [];
    const vertices = [];

    const push = (key, vertex) => {
        let index = keys.length;
        keys.push(key);
        vertices.push(vertex);
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (keys[parent] <= key) {
                break;
            }
            keys[index] = keys[parent];
            vertices[index] = vertices[parent];
            index = parent;
        }
        keys[index] = key;
        vertices[index] = vertex;
    };

    const pop = () => {
        const topKey = keys[0];
        const topVertex = vertices[0];
        const lastKey = keys.pop();
        const lastVertex = vertices.pop();
        if (keys.length > 0) {
            let index = 0;
            for (;;) {
                const left = 2 * index + 1;
                if (left >= keys.length) {
                    break;
                }
                const right = left + 1;
                const child = right < keys.length && keys[right] < keys[left] ? right : left;
                if (keys[child] >= lastKey) {
                    break;
                }
                keys[index] = keys[child];
                vertices[index] = vertices[child];
                index = child;
            }
            keys[index] = lastKey;
            vertices[index] = lastVertex;
        }
        return [topKey, topVertex];
    };

    distance[source] = 0;
    push(0, source);
    while (keys.length > 0) {
        const [current, v] = pop();
        if (current !== distance[v]) {
            continue;
        }
        for (const [to, weight] of adjacency[v]) {
            const candidate = current + weight;
            if (candidate < distance[to]) {
                distance[to] = candidate;
                push(candidate, to);
            }
        }
    }
    return distance;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    if (n <= 0) {
        process.stdout.write("\n");
        return;
    }

    const edges = [];
    let index = 2;
    for (let e = 0; e < m; e += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        const w = Number(tokens[index + 2]);
        index += 3;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edges.push([u, v, w]);
    }

    const height = findPotentials(n, edges);
    if (height === null) {
        process.stdout.write("NEGATIVE CYCLE\n");
        return;
    }

    const adjacency = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) {
        // The reduced weight is nonnegative: height[v] <= height[u] + w.
        adjacency[u].push([v, w + height[u] - height[v]]);
    }

    const lines = [];
    for (let source = 0; source < n; source += 1) {
        const distance = dijkstra(n, adjacency, source);
        const row = [];
        for (let v = 0; v < n; v += 1) {
            if (distance[v] === Number.POSITIVE_INFINITY) {
                row.push("-1");
            } else {
                row.push(String(distance[v] - height[source] + height[v]));
            }
        }
        lines.push(row.join(" "));
    }
    process.stdout.write(lines.join("\n") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
