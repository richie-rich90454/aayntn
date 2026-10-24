"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Matrix chain multiplication with the monotone split window.
 *
 * Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
 * p[i] by p[i + 1], for 0 <= i < n.
 * Output: the minimum number of scalar multiplications.
 *
 * The split for a range [i, j] is only searched in
 * [opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic
 * interval table into a quadratic one.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isFinite(n) || n <= 0) {
        process.stdout.write("0\n");
        return;
    }

    const p = new Array(n + 1).fill(1);
    for (let i = 0; i <= n; i += 1) {
        const index = 1 + i;
        if (index < tokens.length) {
            p[i] = Number(tokens[index]);
        }
    }

    const dp = Array.from({ length: n }, () => new Array(n).fill(0));
    const opt = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i += 1) {
        opt[i][i] = i;
    }

    for (let length = 2; length <= n; length += 1) {
        for (let i = 0; i + length <= n; i += 1) {
            const j = i + length - 1;
            let lo = opt[i][j - 1];
            let hi = opt[i + 1][j];
            if (lo < i) {
                lo = i;
            }
            if (hi > j - 1) {
                hi = j - 1;
            }
            if (lo > hi) {
                lo = i;
                hi = j - 1;
            }

            let best = -1;
            let bestK = lo;
            for (let k = lo; k <= hi; k += 1) {
                const cost = dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1];
                if (best < 0 || cost < best) {
                    best = cost;
                    bestK = k;
                }
            }
            dp[i][j] = best;
            opt[i][j] = bestK;
        }
    }

    process.stdout.write(String(dp[0][n - 1]) + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
