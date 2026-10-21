"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * A disjoint set over the elements 0..n-1, driven by the operations read from
 * standard input.
 *
 * Input: n q, then q operations. "1 u v" merges the sets of u and v and "2 u v"
 * queries whether u and v are in the same set.
 * Output: one line per query, holding yes or no.
 */
class DisjointSet {
    /**
     * @param {number} n the number of elements, numbered from 0
     */
    constructor(n) {
        const count = n > 0 ? n : 0;
        this.parent = [];
        this.size = [];
        for (let i = 0; i < count; i += 1) {
            this.parent.push(i);
            this.size.push(1);
        }
    }

    /**
     * The representative of the set holding x, compressing the path to it.
     *
     * @param {number} x the element
     * @returns {number} the representative of the set
     */
    find(x) {
        let root = x;
        while (this.parent[root] !== root) {
            root = this.parent[root];
        }
        // Every element on the path now points at the root.
        while (this.parent[x] !== x) {
            const next = this.parent[x];
            this.parent[x] = root;
            x = next;
        }
        return root;
    }

    /**
     * Merges the sets holding a and b.
     *
     * @param {number} a the first element
     * @param {number} b the second element
     */
    unite(a, b) {
        let rootA = this.find(a);
        let rootB = this.find(b);
        if (rootA === rootB) {
            return;
        }
        // The larger set absorbs the smaller one, which keeps the trees shallow.
        if (this.size[rootA] < this.size[rootB]) {
            const swap = rootA;
            rootA = rootB;
            rootB = swap;
        }
        this.parent[rootB] = rootA;
        this.size[rootA] += this.size[rootB];
    }

    /**
     * Whether a and b belong to the same set.
     *
     * @param {number} a the first element
     * @param {number} b the second element
     * @returns {boolean} true when both elements share a set
     */
    same(a, b) {
        return this.find(a) === this.find(b);
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

    const n = Number(tokens[0]);
    let q = Number(tokens[1]);
    if (q < 0) {
        q = 0;
    }

    const groups = new DisjointSet(n);
    const out = [];
    let index = 2;
    for (let i = 0; i < q; i += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const op = Number(tokens[index]);
        const u = Number(tokens[index + 1]);
        const v = Number(tokens[index + 2]);
        index += 3;
        const valid = u >= 0 && u < n && v >= 0 && v < n;
        if (op === 1) {
            if (valid) {
                groups.unite(u, v);
            }
        } else if (op === 2) {
            out.push(valid && groups.same(u, v) ? "yes\n" : "no\n");
        }
    }

    process.stdout.write(out.join(""));
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
