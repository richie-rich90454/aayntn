"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
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
     * The ancestor of v that lies 2^k edges above it.
     *
     * @param {number} v the vertex
     * @param {number} k the exponent of the jump
     * @returns {number} the ancestor
     */
    lift(v, k) {
        if (v < 0 || v >= this.n) {
            return -1;
        }
        const step = Math.max(0, Math.min(k, this.levels - 1));
        return this.up[step * this.n + v];
    }

    /**
     * The number of edges from the root to v.
     *
     * @param {number} v the vertex
     * @returns {number} the depth
     */
    depthOf(v) {
        if (v < 0 || v >= this.n) {
            return -1;
        }
        return this.depth[v];
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

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
const lca = new Lca([[1, 2], [0, 3, 4], [0], [1], [1]], 0);
if (lca.query(3, 4) !== 1) {
    throw new Error("lca contract broken");
}
if (lca.query(2, 3) !== 0) {
    throw new Error("lca contract broken");
}
if (lca.query(0, 4) !== 0) {
    throw new Error("lca contract broken");
}
// A vertex is its own lowest common ancestor.
if (lca.query(3, 3) !== 3) {
    throw new Error("lca contract broken");
}
if (lca.depthOf(0) !== 0 || lca.depthOf(1) !== 1 || lca.depthOf(3) !== 2) {
    throw new Error("lca contract broken");
}
if (lca.lift(3, 0) !== 1 || lca.lift(3, 1) !== 0) {
    throw new Error("lca contract broken");
}
