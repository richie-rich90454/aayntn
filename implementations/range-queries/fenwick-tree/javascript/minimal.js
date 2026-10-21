"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * A Fenwick tree (binary indexed tree) over a 1-indexed array: tree[i] holds
 * the sum of the positions in the block (i - lowbit(i), i], where lowbit(i) is
 * the largest power of two that divides i.
 */
class Fenwick {
    /**
     * @param {number} n the number of positions, numbered from 1
     */
    constructor(n) {
        this.n = n;
        this.tree = new Array(n + 1).fill(0);
    }

    /**
     * Adds delta to the value at the 1-based index.
     *
     * @param {number} index the 1-based position
     * @param {number} delta the amount to add
     */
    add(index, delta) {
        if (index < 1) {
            return;
        }
        // Stepping up by lowbit visits exactly the blocks that contain the index.
        let i = index;
        while (i <= this.n) {
            this.tree[i] += delta;
            i += i & -i;
        }
    }

    /**
     * The sum of the positions 1..index.
     *
     * @param {number} index the last position of the prefix
     * @returns {number} the prefix sum
     */
    prefixSum(index) {
        const last = Math.min(index, this.n);
        let total = 0;
        // Stepping down by lowbit visits disjoint blocks that partition 1..index.
        let i = last;
        while (i > 0) {
            total += this.tree[i];
            i -= i & -i;
        }
        return total;
    }

    /**
     * The sum of the positions left..right, both inclusive.
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @returns {number} the range sum
     */
    rangeSum(left, right) {
        return this.prefixSum(right) - this.prefixSum(left - 1);
    }
}

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
const tree = new Fenwick(5);
tree.add(1, 5);
tree.add(2, 3);
if (tree.prefixSum(2) !== 8) {
    throw new Error("fenwick contract broken");
}
if (tree.rangeSum(1, 2) !== 8) {
    throw new Error("fenwick contract broken");
}
if (tree.rangeSum(1, 5) !== 8) {
    throw new Error("fenwick contract broken");
}
if (tree.rangeSum(3, 5) !== 0) {
    throw new Error("fenwick contract broken");
}
// A negative delta removes value, and the empty prefix sums to zero.
tree.add(2, -3);
if (tree.rangeSum(1, 5) !== 5) {
    throw new Error("fenwick contract broken");
}
if (tree.prefixSum(0) !== 0) {
    throw new Error("fenwick contract broken");
}
