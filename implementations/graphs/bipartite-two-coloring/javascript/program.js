"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * The two-coloring test for an undirected graph read from standard input.
 *
 * Input: n m, then m lines u v (0-based, undirected).
 * Output: the color of every vertex, 0 or 1, separated by spaces, or the single
 * line -1 when the graph is not bipartite.
 */

/**
 * Two-colors an undirected graph, one connected component at a time.
 *
 * A vertex receives the opposite color of the vertex that discovered it, so its
 * color is the parity of its breadth-first distance from the root of its
 * component. The test fails when an edge joins two vertices of the same parity,
 * because that edge closes an odd cycle.
 *
 * @param {number[][]} adj adjacency list; adj[v] lists the neighbors of v
 * @returns {number[] | null} the colors, or null when the graph is not
 *   bipartite
 */
function twoColor(adj) {
    const color = new Array(adj.length).fill(-1);
    const queue = [];

    for (let s = 0; s < adj.length; s += 1) {
        if (color[s] !== -1) {
            // This component was already colored.
            continue;
        }
        color[s] = 0;
        queue.length = 0;
        queue.push(s);
        let head = 0;
        while (head < queue.length) {
            const u = queue[head];
            head += 1;
            for (const v of adj[u]) {
                if (color[v] === -1) {
                    color[v] = color[u] ^ 1;
                    queue.push(v);
                } else if (color[v] === color[u]) {
                    // The edge closes an odd cycle.
                    return null;
                }
            }
        }
    }
    return color;
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
        if (index + 1 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        index += 2;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[u].push(v);
        adj[v].push(u);
    }

    const color = twoColor(adj);
    if (color === null) {
        process.stdout.write("-1\n");
    } else {
        process.stdout.write(color.join(" ") + "\n");
    }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
