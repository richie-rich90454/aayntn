"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * The lowest common ancestor of two vertices of a tree, read from standard
 * input.
 *
 * Input: n m, then m lines u v (0-based, undirected), then q, then q lines u v
 * with the queried pair of vertices.
 * Output: one line per query, holding the index of the lowest common ancestor.
 */

/**
 * A binary-lifting table for a tree rooted at one vertex: up[k * n + v] is
 * the ancestor of v that lies 2^k edges above it, and depth[v] is the number
 * of edges from the root to v.
 *
 * The instance owns its arrays, so the table is reclaimed with the object.
 */
class Lca {
    /**
     * @param {number[][]} adj adjacency list; adj[v] lists the neighbours of
     *   the vertex v
     * @param {number} root the root of the tree
     */
    constructor(adj, root) {
        this.n = adj.length;
        let levels = 1;
        while (1 << levels <= this.n) {
            levels += 1;
        }
        this.levels = levels;
        this.depth = new Array(this.n).fill(-1);
        this.up = new Array(levels * this.n).fill(0);
        if (this.n <= 0 || root < 0 || root >= this.n) {
            return;
        }

        // The root is its own ancestor, so the table stays defined everywhere.
        this.up[root] = root;
        this.depth[root] = 0;

        const queue = [root];
        let head = 0;
        while (head < queue.length) {
            const u = queue[head];
            head += 1;
            for (const w of adj[u]) {
                if (this.depth[w] !== -1) {
                    // The vertex was already reached through another edge.
                    continue;
                }
                this.depth[w] = this.depth[u] + 1;
                this.up[w] = u;
                queue.push(w);
            }
        }

        // The table of the 2^k ancestors is built from the table of the 2^(k-1).
        for (let k = 1; k < levels; k += 1) {
            const previous = (k - 1) * this.n;
            const current = k * this.n;
            for (let v = 0; v < this.n; v += 1) {
                this.up[current + v] = this.up[previous + this.up[previous + v]];
            }
        }
    }

    /**
     * The lowest common ancestor of u and v.
     *
     * @param {number} u the first vertex
     * @param {number} v the second vertex
     * @returns {number} the lowest common ancestor
     */
    query(u, v) {
        if (u < 0 || u >= this.n || v < 0 || v >= this.n) {
            return -1;
        }
        if (this.depth[u] < 0 || this.depth[v] < 0) {
            // A vertex outside the component of the root has no ancestor.
            return -1;
        }
        if (this.depth[u] < this.depth[v]) {
            const swap = u;
            u = v;
            v = swap;
        }

        // Lift the deeper vertex until both stand at the same depth.
        let difference = this.depth[u] - this.depth[v];
        let k = 0;
        while (difference > 0) {
            if (difference & 1) {
                u = this.up[k * this.n + u];
            }
            difference = Math.floor(difference / 2);
            k += 1;
        }
        if (u === v) {
            return u;
        }

        // From the largest jump downwards, the two vertices either stay
        // together or they both move one step below the common ancestor.
        for (let step = this.levels - 1; step >= 0; step -= 1) {
            const ancestorU = this.up[step * this.n + u];
            const ancestorV = this.up[step * this.n + v];
            if (ancestorU !== ancestorV) {
                u = ancestorU;
                v = ancestorV;
            }
        }
        return this.up[u];
    }
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const m = Math.max(0, Number(tokens[1]));

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

    const lca = new Lca(adj, 0);

    const q = index < tokens.length ? Number(tokens[index]) : 0;
    index += 1;
    const lines = [];
    for (let k = 0; k < q; k += 1) {
        if (index + 1 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        index += 2;
        lines.push(String(lca.query(u, v)));
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join("\n") + "\n");
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
