"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * A disjoint set over the elements 0..n-1.
 *
 * Union by size keeps the trees shallow and path compression flattens them, so
 * the two together make every operation take amortised constant time.
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

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
const groups = new DisjointSet(5);
groups.unite(0, 1);
groups.unite(2, 3);
if (!groups.same(0, 1)) {
    throw new Error("disjoint set contract broken");
}
if (groups.same(0, 2)) {
    throw new Error("disjoint set contract broken");
}
if (groups.same(0, 3)) {
    throw new Error("disjoint set contract broken");
}
if (groups.find(0) !== groups.find(1)) {
    throw new Error("disjoint set contract broken");
}
if (groups.find(0) === groups.find(2)) {
    throw new Error("disjoint set contract broken");
}
groups.unite(1, 3);
if (!groups.same(0, 3)) {
    throw new Error("disjoint set contract broken");
}
if (!groups.same(2, 3)) {
    throw new Error("disjoint set contract broken");
}
if (groups.same(0, 4)) {
    throw new Error("disjoint set contract broken");
}
