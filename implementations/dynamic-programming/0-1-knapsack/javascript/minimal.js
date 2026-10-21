"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Maximum total value of a subset of the items whose total weight is at most
 * capacity.
 *
 * @param {number[]} weights the weight of every item
 * @param {number[]} values the value of every item, parallel to weights
 * @param {number} capacity the weight budget
 * @returns {number} the largest total value that fits in capacity
 */
function knapsackMaxValue(weights, values, capacity) {
    if (capacity < 0) {
        return 0;
    }

    const table = new Array(capacity + 1).fill(0);
    const count = Math.min(weights.length, values.length);
    for (let i = 0; i < count; i += 1) {
        const weight = Math.max(0, weights[i]);

        // The capacity must run downwards: table[c - weight] has to still hold the
        // answer for the items before this one. With an upwards sweep that cell
        // would already include this item, so the item would be counted more than
        // once and the table would solve the unbounded knapsack.
        for (let c = capacity; c >= weight; c -= 1) {
            const candidate = table[c - weight] + values[i];
            if (candidate > table[c]) {
                table[c] = candidate;
            }
        }
    }

    return table[capacity];
}

// Self-check only: the routine above is the reusable part, so this file
// asserts the documented contract instead of reading input.
const weights = [3, 4, 5, 2];
const values = [4, 5, 7, 3];
if (knapsackMaxValue(weights, values, 7) !== 10) {
    throw new Error("knapsack contract broken");
}
// An item that fits twice is still worth its value only once.
if (knapsackMaxValue([2], [3], 4) !== 3) {
    throw new Error("knapsack contract broken");
}
// An item heavier than the budget is never taken.
if (knapsackMaxValue([5], [9], 4) !== 0) {
    throw new Error("knapsack contract broken");
}
// No items at all.
if (knapsackMaxValue([], [], 7) !== 0) {
    throw new Error("knapsack contract broken");
}
