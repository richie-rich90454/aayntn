"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Count the tilings of an r x c grid with 1 x 2 and 2 x 1 dominoes.
 *
 * Input: r c, then r strings of c characters. '0' is a free cell and '1' is
 * blocked.
 * Output: the number of ways to cover every free cell exactly once.
 *
 * Before cell k the mask describes the next c cells: bit d is 1 when cell
 * k + d is already covered by a domino placed earlier. Bit 0 is cell k.
 *
 * The counters are BigInt because a full 12 x 12 board has more than 2^53
 * tilings, which a plain Number cannot represent exactly.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const r = Number(tokens[0]);
    const c = Number(tokens[1]);
    if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0 || c <= 0) {
        process.stdout.write("1\n");
        return;
    }

    const grid = [];
    for (let i = 0; i < r; i += 1) {
        grid.push(tokens[2 + i] ?? "");
    }

    const size = 1 << c;
    let dp = new Array(size).fill(0n);
    let next = new Array(size).fill(0n);
    dp[0] = 1n;

    for (let i = 0; i < r; i += 1) {
        for (let j = 0; j < c; j += 1) {
            const k = i * c + j;
            next.fill(0n);
            for (let mask = 0; mask < size; mask += 1) {
                const ways = dp[mask];
                if (ways === 0n) {
                    continue;
                }
                const base = mask >> 1;

                if (grid[i][j] === "1") {
                    if ((mask & 1) === 0) {
                        next[base] += ways;
                    }
                } else if ((mask & 1) !== 0) {
                    next[base] += ways;
                } else {
                    if (j + 1 < c && grid[i][j + 1] === "0" && (mask & 2) === 0) {
                        next[base | 1] += ways;
                    }
                    if (i + 1 < r && grid[i + 1][j] === "0") {
                        next[base | (1 << (c - 1))] += ways;
                    }
                }
            }
            const swap = dp;
            dp = next;
            next = swap;
        }
    }

    process.stdout.write(dp[0].toString() + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
