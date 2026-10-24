// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * The total weight of the virtual tree of the marked vertices of a rooted
 * weighted tree.
 *
 * Input: n m, then m lines u v w with 0-based undirected weighted edges, then
 * q, then q lines k a1 ... ak with the marked vertices.
 * Output: one line per query with the total weight of the virtual tree's
 * edges. The root is the vertex 0, duplicate marks count once, and a mark
 * outside the tree or outside the root's component is ignored.
 */

class Tree {
    /**
     * @param {number[][][]} adj adjacency list; adj[v] holds [neighbor, weight]
     */
    constructor(adj) {
        const n = adj.length;
        this.n = n;
        let levels = 1;
        while (1 << levels <= n) {
            levels += 1;
        }
        this.levels = levels;
        this.parent = new Int32Array(n).fill(-1);
        this.depth = new Int32Array(n).fill(-1);
        this.tin = new Int32Array(n).fill(-1);
        this.tout = new Int32Array(n).fill(-1);
        this.distance = new Float64Array(n);
        this.up = new Int32Array(levels * n);
        if (n <= 0) {
            return;
        }

        const cursor = new Int32Array(n);
        const stack = [];
        this.parent[0] = 0;
        this.depth[0] = 0;
        this.tin[0] = 0;
        let timer = 1;
        stack.push(0);
        while (stack.length > 0) {
            const v = stack[stack.length - 1];
            const edges = adj[v];
            let e = cursor[v];
            while (e < edges.length && this.parent[edges[e][0]] !== -1) {
                e += 1;
            }
            cursor[v] = e;
            if (e === edges.length) {
                this.tout[v] = timer;
                stack.pop();
                continue;
            }
            cursor[v] = e + 1;
            const [u, w] = edges[e];
            this.parent[u] = v;
            this.depth[u] = this.depth[v] + 1;
            this.distance[u] = this.distance[v] + w;
            this.tin[u] = timer;
            timer += 1;
            stack.push(u);
        }

        // The root is its own ancestor, so every entry of the table is defined.
        for (let v = 0; v < n; v += 1) {
            this.up[v] = this.parent[v] >= 0 ? this.parent[v] : v;
        }
        for (let k = 1; k < levels; k += 1) {
            const previous = (k - 1) * n;
            const current = k * n;
            for (let v = 0; v < n; v += 1) {
                this.up[current + v] = this.up[previous + this.up[previous + v]];
            }
        }
    }

    /**
     * @param {number} u the first vertex
     * @param {number} v the second vertex
     * @returns {number} the lowest common ancestor, or -1 outside the tree
     */
    lca(u, v) {
        if (u < 0 || u >= this.n || v < 0 || v >= this.n) {
            return -1;
        }
        if (this.depth[u] < 0 || this.depth[v] < 0) {
            return -1;
        }
        if (this.depth[u] < this.depth[v]) {
            const swap = u;
            u = v;
            v = swap;
        }
        let difference = this.depth[u] - this.depth[v];
        let k = 0;
        while (difference > 0) {
            if ((difference & 1) !== 0) {
                u = this.up[k * this.n + u];
            }
            difference >>= 1;
            k += 1;
        }
        if (u === v) {
            return u;
        }
        for (let level = this.levels - 1; level >= 0; level -= 1) {
            const ancestorU = this.up[level * this.n + u];
            const ancestorV = this.up[level * this.n + v];
            if (ancestorU !== ancestorV) {
                u = ancestorU;
                v = ancestorV;
            }
        }
        return this.up[u];
    }

    /**
     * @param {number} u a vertex
     * @param {number} v another vertex
     * @returns {boolean} whether u lies on the path from the root to v
     */
    isAncestor(u, v) {
        return this.tin[u] <= this.tin[v] && this.tin[v] < this.tout[u];
    }
}

function main(input) {
    if (input.trim().length === 0) {
        return;
    }
    const tokens = input.trim().split(/\s+/);
    let position = 0;
    const next = () => Number(tokens[position++]);

    const n = Math.max(0, next());
    const m = Math.max(0, next());
    const adj = Array.from({ length: n }, () => []);
    for (let i = 0; i < m; i += 1) {
        if (position + 2 >= tokens.length) {
            break;
        }
        const u = next();
        const v = next();
        const w = next();
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }

    const tree = new Tree(adj);

    const q = position < tokens.length ? Math.max(0, next()) : 0;
    const stamp = new Int32Array(n);
    const out = [];
    for (let query = 0; query < q; query += 1) {
        if (position >= tokens.length) {
            break;
        }
        const k = Math.max(0, next());
        const queryId = query + 1;
        const marks = [];
        let complete = true;
        for (let i = 0; i < k; i += 1) {
            if (position >= tokens.length) {
                complete = false;
                break;
            }
            const v = next();
            if (v >= 0 && v < n && tree.depth[v] >= 0 && stamp[v] !== queryId) {
                stamp[v] = queryId;
                marks.push(v);
            }
        }
        if (!complete) {
            break;
        }
        if (marks.length < 2) {
            out.push("0");
            continue;
        }

        marks.sort((a, b) => tree.tin[a] - tree.tin[b]);
        const nodes = marks.slice();
        for (let i = 0; i + 1 < marks.length; i += 1) {
            const ancestor = tree.lca(marks[i], marks[i + 1]);
            if (ancestor >= 0) {
                nodes.push(ancestor);
            }
        }
        nodes.sort((a, b) => tree.tin[a] - tree.tin[b]);

        let unique = 0;
        for (let i = 0; i < nodes.length; i += 1) {
            if (unique === 0 || nodes[i] !== nodes[unique - 1]) {
                nodes[unique] = nodes[i];
                unique += 1;
            }
        }
        nodes.length = unique;

        let total = 0;
        const stack = [];
        for (const v of nodes) {
            while (stack.length > 0 && !tree.isAncestor(stack[stack.length - 1], v)) {
                stack.pop();
            }
            if (stack.length > 0) {
                total += tree.distance[v] - tree.distance[stack[stack.length - 1]];
            }
            stack.push(v);
        }
        out.push(String(total));
    }

    if (out.length > 0) {
        process.stdout.write(`${out.join("\n")}\n`);
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
