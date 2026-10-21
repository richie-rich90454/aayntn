"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * A segment tree over a 1-indexed array of n values: tree[node] holds the sum
 * of the values of the range that the node covers, so every node caches the
 * result of merging its two children.
 *
 * The instance owns its array, so the tree is reclaimed with the object.
 */
class SegmentTree {
    /**
     * @param {number[]} values the values of the positions 1..n, so values[0]
     *   holds the value of the position 1
     */
    constructor(values) {
        this.n = values.length;
        this.tree = new Array(4 * this.n + 4).fill(0);
        if (this.n > 0) {
            this.build(1, 1, this.n, values);
        }
    }

    /**
     * Assigns the value at the 1-based index; an index outside 1..n is
     * ignored.
     *
     * @param {number} index the 1-based position
     * @param {number} value the new value
     */
    set(index, value) {
        if (index < 1 || index > this.n) {
            return;
        }
        this.assign(1, 1, this.n, index, value);
    }

    /**
     * The sum of the positions left..right, both inclusive.
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @returns {number} the range sum
     */
    rangeSum(left, right) {
        const first = Math.max(left, 1);
        const last = Math.min(right, this.n);
        if (first > last) {
            return 0;
        }
        return this.query(1, 1, this.n, first, last);
    }

    /**
     * Fills the subtree of node, which covers the positions lo..hi.
     */
    build(node, lo, hi, values) {
        if (lo === hi) {
            this.tree[node] = values[lo - 1];
            return;
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        this.build(node * 2, lo, mid, values);
        this.build(node * 2 + 1, mid + 1, hi, values);
        this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
    }

    /**
     * Assigns the value at the 1-based index inside the subtree of node.
     */
    assign(node, lo, hi, index, value) {
        if (lo === hi) {
            this.tree[node] = value;
            return;
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        if (index <= mid) {
            this.assign(node * 2, lo, mid, index, value);
        } else {
            this.assign(node * 2 + 1, mid + 1, hi, index, value);
        }
        // Merging the two children restores the invariant of the node.
        this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
    }

    /**
     * The sum of the positions left..right inside the subtree of node.
     */
    query(node, lo, hi, left, right) {
        if (right < lo || hi < left) {
            // The queried range and the subtree do not overlap.
            return 0;
        }
        if (left <= lo && hi <= right) {
            return this.tree[node];
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        return (
            this.query(node * 2, lo, mid, left, right) +
            this.query(node * 2 + 1, mid + 1, hi, left, right)
        );
    }
}

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
const tree = new SegmentTree([1, 2, 3, 4, 5]);
if (tree.rangeSum(1, 5) !== 15) {
    throw new Error("segment tree contract broken");
}
if (tree.rangeSum(2, 4) !== 9) {
    throw new Error("segment tree contract broken");
}
if (tree.rangeSum(3, 3) !== 3) {
    throw new Error("segment tree contract broken");
}

tree.set(3, 30);
if (tree.rangeSum(1, 5) !== 42) {
    throw new Error("segment tree contract broken");
}
if (tree.rangeSum(3, 5) !== 39) {
    throw new Error("segment tree contract broken");
}

// A negative value is an ordinary value, and an empty range sums to 0.
tree.set(1, -10);
if (tree.rangeSum(1, 5) !== 31) {
    throw new Error("segment tree contract broken");
}
if (tree.rangeSum(4, 2) !== 0) {
    throw new Error("segment tree contract broken");
}

// An index outside the array is ignored.
tree.set(9, 100);
tree.set(0, 100);
if (tree.rangeSum(1, 5) !== 31) {
    throw new Error("segment tree contract broken");
}
