/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

"use strict";

/**
 * The minimum total squared group sum when an array is split into k contiguous
 * nonempty groups.
 *
 * Input: n k, then n integers.
 * Output: the minimum possible sum of squared group sums.
 *
 * dp[g][i] = min over j < i of dp[g - 1][j] + (prefix[i] - prefix[j]) ** 2.
 * The best j never moves left as i grows, so the middle entry of a range is
 * solved directly and its optimal split point bounds both halves.
 *
 * The values are numbers. Under the stated constraints the largest cost is
 * about 4 * 10^14, which is far below 2^53, so every value is exact.
 */

const INF = Number.MAX_SAFE_INTEGER;

/**
 * @param {number} left first prefix index of this range
 * @param {number} right last prefix index of this range
 * @param {number} optLeft smallest candidate split point
 * @param {number} optRight largest candidate split point
 * @param {number[]} prefix prefix sums
 * @param {number[]} previous previous DP row
 * @param {number[]} current row being filled
 */
function solveLayer(left, right, optLeft, optRight, prefix, previous, current) {
    if (left > right) {
        return;
    }

    const mid = left + Math.floor((right - left) / 2);
    const upper = Math.min(optRight, mid - 1);
    let best = INF;
    let bestJ = optLeft;

    for (let j = optLeft; j <= upper; j += 1) {
        const difference = prefix[mid] - prefix[j];
        const candidate = previous[j] + difference * difference;
        if (candidate < best) {
            best = candidate;
            bestJ = j;
        }
    }

    current[mid] = best;
    // The optimal split of mid bounds the candidates of both halves.
    solveLayer(left, mid - 1, optLeft, bestJ, prefix, previous, current);
    solveLayer(mid + 1, right, bestJ, optRight, prefix, previous, current);
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
    let k = Number(tokens[1]);
    if (n <= 0) {
        process.stdout.write("0\n");
        return;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    const prefix = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i += 1) {
        const value = i + 1 < tokens.length ? Number(tokens[i + 1]) : 0;
        prefix[i] = prefix[i - 1] + value;
    }

    let previous = new Array(n + 1).fill(INF);
    let current = new Array(n + 1).fill(INF);
    previous[0] = 0;

    for (let g = 1; g <= k; g += 1) {
        current.fill(INF);
        // Layer g only needs prefixes that leave room for the remaining groups.
        const last = n - k + g;
        solveLayer(g, last, g - 1, last - 1, prefix, previous, current);
        const swap = previous;
        previous = current;
        current = swap;
    }

    // An explicit newline keeps the output identical on every platform.
    process.stdout.write(String(previous[n]) + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
