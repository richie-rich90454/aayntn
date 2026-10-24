// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * The hook-length formula, driven from standard input.
 *
 * Input: one integer k, then k non-increasing row lengths whose sum is n.
 * Output: the number of standard Young tableaux of the shape modulo 1000000007.
 */

const MODULUS = 1000000007n;

/**
 * @param {bigint} base
 * @param {bigint} exponent
 */
function modPow(base, exponent) {
    let result = 1n;
    let factor = base % MODULUS;
    let power = exponent;
    while (power > 0n) {
        if ((power & 1n) === 1n) {
            result = (result * factor) % MODULUS;
        }
        factor = (factor * factor) % MODULUS;
        power >>= 1n;
    }
    return result;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const k = Number(tokens[0]);
    if (!Number.isInteger(k) || k < 0 || tokens.length < k + 1) {
        return;
    }

    const rows = tokens.slice(1, k + 1).map((token) => Number(token));
    if (rows.some((row) => !Number.isInteger(row) || row < 0)) {
        return;
    }

    const n = rows.reduce((sum, row) => sum + row, 0);
    const width = k > 0 ? rows[0] : 0;
    const heights = new Int32Array(width);
    for (const row of rows) {
        for (let column = 0; column < row; column += 1) {
            heights[column] += 1;
        }
    }

    let numerator = 1n;
    for (let value = 2; value <= n; value += 1) {
        numerator = (numerator * BigInt(value)) % MODULUS;
    }

    let denominator = 1n;
    for (let index = 0; index < k; index += 1) {
        const row = rows[index];
        for (let column = 0; column < row; column += 1) {
            const hook = row - column + heights[column] - index - 1;
            denominator = (denominator * BigInt(hook)) % MODULUS;
        }
    }

    const answer = (numerator * modPow(denominator, MODULUS - 2n)) % MODULUS;
    process.stdout.write(String(answer) + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
