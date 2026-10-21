"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Breadth-first search over an undirected graph read from standard input.
 *
 * Input: n m, then m lines u v (0-based, undirected), then the start vertex.
 * Output: the distance from the start vertex to every vertex, separated by
 * spaces, and -1 for the vertices the start cannot reach.
 */

/**
 * Computes the distance from source to every vertex of an unweighted graph.
 *
 * The queue holds the frontier, so the vertices leave it in order of
 * increasing distance from source: the first time a vertex is discovered its
 * distance is already the length of a shortest path to it.
 *
 * @param {number[][]} adj adjacency list; adj[v] lists the neighbours of v
 * @param {number} source the start vertex
 * @returns {number[]} the distance from source to every vertex, -1 when
 *   unreachable
 */
function bfsDistances(adj, source) {
    const distance = new Array(adj.length).fill(-1);
    if (source < 0 || source >= adj.length) {
        return distance;
    }

    const queue = [source];
    let head = 0;
    distance[source] = 0;
    while (head < queue.length) {
        const v = queue[head];
        head += 1;
        for (const w of adj[v]) {
            if (distance[w] >= 0) {
                // The vertex was already discovered.
                continue;
            }
            distance[w] = distance[v] + 1;
            queue.push(w);
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

    const adj = [];
    for (let v = 0; v < n; v += 1) {
        adj.push([]);
    }

    let index = 2;
    for (let i = 0; i < m; i += 1) {
        if (index >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        index += 1;
        if (index >= tokens.length) {
            break;
        }
        const v = Number(tokens[index]);
        index += 1;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[u].push(v);
        adj[v].push(u);
    }
    const source = index < tokens.length ? Number(tokens[index]) : -1;

    const distance = bfsDistances(adj, source);
    process.stdout.write(distance.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
