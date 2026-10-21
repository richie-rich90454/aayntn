"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Depth-first search that marks a vertex on entry to the recursive call.
 *
 * Every vertex is entered at most once, so the auxiliary space is the visited
 * array plus one stack frame per vertex on the current path: O(V) in total.
 * The call stack can grow to the depth of the graph, which overflows in C++
 * and Java on a long chain.
 */

/**
 * Visits every vertex reachable from source.
 *
 * @param {number[][]} adj adjacency list; adj[v] lists the neighbours of v
 * @param {number} source the start vertex
 * @returns {number[]} the visited vertices in visit order
 */
function dfsRecursive(adj, source) {
    if (source < 0 || source >= adj.length) {
        return [];
    }

    const visited = new Array(adj.length).fill(false);
    const order = [];

    const visit = (v) => {
        visited[v] = true;
        order.push(v);
        for (const w of adj[v]) {
            if (!visited[w]) {
                visit(w);
            }
        }
    };

    visit(source);
    return order;
}

/**
 * Reads n m, then m lines u v (0-based, undirected), then the start vertex,
 * and prints the number of vertices reachable from the start followed by the
 * reachable vertices in increasing index order.
 *
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
        process.stdout.write("0\n\n");
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

    const order = dfsRecursive(adj, source);
    const reachable = new Array(n).fill(false);
    for (const v of order) {
        reachable[v] = true;
    }

    const vertices = [];
    for (let v = 0; v < n; v += 1) {
        if (reachable[v]) {
            vertices.push(String(v));
        }
    }
    process.stdout.write(order.length + "\n");
    process.stdout.write(vertices.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
