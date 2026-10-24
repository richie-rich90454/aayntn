"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 *
 * Input: n W, then n integers.
 * Output: one line holding the number of subsets whose sum is at most W.
 */

import { readFileSync } from "node:fs";

/** Return one sum per subset of values, including the empty subset. */
function subsetSums(values) {
    const sums = [0];
    for (const value of values) {
        const size = sums.length;
        for (let i = 0; i < size; i++) {
            sums.push(sums[i] + value);
        }
    }
    return sums;
}

/** First index whose entry is strictly greater than target. */
function upperBound(values, target) {
    let low = 0;
    let high = values.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (values[middle] <= target) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

function main() {
    const data = readFileSync(0, "utf8").trim().split(/\s+/).map(Number);
    if (data.length < 2) {
        return;
    }
    const n = data[0];
    const limit = data[1];
    const values = data.slice(2, 2 + n);

    const middle = Math.floor(n / 2);
    const left = subsetSums(values.slice(0, middle));
    const right = subsetSums(values.slice(middle));
    right.sort((a, b) => a - b);

    let answer = 0;
    for (const value of left) {
        answer += upperBound(right, limit - value);
    }
    console.log(answer);
}

main();
