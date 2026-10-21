"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * A heavy-light decomposition of a tree rooted at one vertex: size[v] is the
 * number of vertices in the subtree of v, heavy[v] is the child of v with the
 * largest subtree, head[v] is the top of the chain of v and pos[v] is its
 * index in the flattened array.
 *
 * The instance owns its arrays, so the decomposition is reclaimed with the
 * object.
 */
class Hld {
    /**
     * @param {number[][]} adj adjacency list; adj[v] lists the neighbours of
     *   the vertex v
     * @param {number} root the root of the tree
     * @param {number[]} values the value of every vertex, so values[v] is the
     *   value of the vertex v
     */
    constructor(adj, root, values) {
        this.n = adj.length;
        this.parent = new Array(this.n).fill(0);
        this.depth = new Array(this.n).fill(-1);
        this.size = new Array(this.n).fill(1);
        this.heavy = new Array(this.n).fill(-1);
        this.head = new Array(this.n).fill(0);
        this.pos = new Array(this.n).fill(0);
        this.flat = new Array(this.n).fill(0);
        this.prefix = new Array(this.n + 1).fill(0);
        if (this.n <= 0 || root < 0 || root >= this.n) {
            return;
        }

        // A breadth-first walk from the root fixes the parents and the depths.
        this.parent[root] = root;
        this.depth[root] = 0;
        const order = [root];
        let head = 0;
        while (head < order.length) {
            const u = order[head];
            head += 1;
            for (const w of adj[u]) {
                if (this.depth[w] !== -1) {
                    // The vertex was already reached through another edge.
                    continue;
                }
                this.depth[w] = this.depth[u] + 1;
                this.parent[w] = u;
                order.push(w);
            }
        }

        // The subtree sizes are known from the leaves upwards, and the heavy
        // child of a vertex is the child with the largest subtree.
        for (let i = order.length - 1; i >= 0; i -= 1) {
            const u = order[i];
            for (const w of adj[u]) {
                if (w === u || this.parent[w] !== u) {
                    // The vertex is not a child of u.
                    continue;
                }
                this.size[u] += this.size[w];
                const current = this.heavy[u];
                if (current === -1 || this.size[w] > this.size[current]) {
                    this.heavy[u] = w;
                }
            }
        }

        // The flattened array holds one chain after the other, so the
        // vertices of a chain occupy a contiguous range of indices.
        let timer = 0;
        for (const v of order) {
            if (v !== root && this.heavy[this.parent[v]] === v) {
                // The vertex continues the chain of its parent.
                continue;
            }
            let u = v;
            while (u !== -1) {
                this.head[u] = v;
                this.pos[u] = timer;
                this.flat[timer] = values[u];
                timer += 1;
                u = this.heavy[u];
            }
        }

        // The prefix sums turn every chain segment into a single subtraction,
        // so a path query costs one step per chain instead of a segment tree
        // walk.
        for (let i = 0; i < this.n; i += 1) {
            this.prefix[i + 1] = this.prefix[i] + this.flat[i];
        }
    }

    /**
     * The number of vertices in the subtree of v.
     *
     * @param {number} v the vertex
     * @returns {number} the size of the subtree
     */
    subtreeSize(v) {
        if (v < 0 || v >= this.n) {
            return 0;
        }
        return this.size[v];
    }

    /**
     * The child of v with the largest subtree, or -1 when v is a leaf.
     *
     * @param {number} v the vertex
     * @returns {number} the heavy child
     */
    heavyChild(v) {
        if (v < 0 || v >= this.n) {
            return -1;
        }
        return this.heavy[v];
    }

    /**
     * The top of the chain of v.
     *
     * @param {number} v the vertex
     * @returns {number} the head of the chain
     */
    chainHead(v) {
        if (v < 0 || v >= this.n) {
            return -1;
        }
        return this.head[v];
    }

    /**
     * The index of v in the flattened array.
     *
     * @param {number} v the vertex
     * @returns {number} the position
     */
    position(v) {
        if (v < 0 || v >= this.n) {
            return -1;
        }
        return this.pos[v];
    }

    /**
     * The sum of the values of the vertices on the path from u to v.
     *
     * @param {number} u the first vertex
     * @param {number} v the second vertex
     * @returns {number} the sum of the path
     */
    pathSum(u, v) {
        if (u < 0 || u >= this.n || v < 0 || v >= this.n) {
            return 0;
        }
        if (this.depth[u] < 0 || this.depth[v] < 0) {
            // A vertex outside the component of the root lies on no path.
            return 0;
        }

        let total = 0;
        while (this.head[u] !== this.head[v]) {
            if (this.depth[this.head[u]] < this.depth[this.head[v]]) {
                const swap = u;
                u = v;
                v = swap;
            }
            // The chain of u is a contiguous range of the flattened array.
            const top = this.head[u];
            total += this.prefix[this.pos[u] + 1] - this.prefix[this.pos[top]];
            u = this.parent[top];
        }
        if (this.depth[u] > this.depth[v]) {
            const swap = u;
            u = v;
            v = swap;
        }
        total += this.prefix[this.pos[v] + 1] - this.prefix[this.pos[u]];
        return total;
    }
}

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
// The tree 0-1, 1-2, 1-3 with the value of the vertex i equal to i + 1.
const hld = new Hld([[1], [0, 2, 3], [1], [1]], 0, [1, 2, 3, 4]);
if (hld.subtreeSize(0) !== 4 || hld.subtreeSize(1) !== 3) {
    throw new Error("decomposition contract broken");
}
if (hld.subtreeSize(2) !== 1 || hld.subtreeSize(3) !== 1) {
    throw new Error("decomposition contract broken");
}
if (hld.heavyChild(0) !== 1 || hld.heavyChild(1) !== 2) {
    throw new Error("decomposition contract broken");
}
if (hld.pathSum(2, 3) !== 9) {
    throw new Error("decomposition contract broken");
}
if (hld.pathSum(0, 3) !== 7) {
    throw new Error("decomposition contract broken");
}
// The path of a vertex with itself holds that vertex alone.
if (hld.pathSum(0, 0) !== 1) {
    throw new Error("decomposition contract broken");
}
if (hld.pathSum(1, 1) !== 2) {
    throw new Error("decomposition contract broken");
}
