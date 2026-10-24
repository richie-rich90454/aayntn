// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Subset zeta transform.
 *
 * Input: n, then the 2^n values f[0] .. f[2^n - 1], one value per mask.
 * Output: g[0] .. g[2^n - 1], where g[S] is the sum of f[T] over T subset of S,
 * reduced modulo 1000000007.
 *
 * Two values below 1000000007 add to less than 2^31, so a plain number is exact
 * and no BigInt is needed.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isFinite(n) || n < 0 || n > 24) {
        return;
    }

    const total = 1 << n;
    const g = new Array(total).fill(0);
    for (let mask = 0; mask < total; mask += 1) {
        const value = Number(tokens[1 + mask]);
        g[mask] = Number.isFinite(value) ? value % 1000000007 : 0;
    }

    const MOD = 1000000007;
    let step = 1;
    for (let bit = 0; bit < n; bit += 1) {
        for (let base = 0; base < total; base += step << 1) {
            for (let off = 0; off < step; off += 1) {
                const target = base + step + off;
                g[target] += g[base + off];
                if (g[target] >= MOD) {
                    g[target] -= MOD;
                }
            }
        }
        step <<= 1;
    }

    process.stdout.write(g.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
