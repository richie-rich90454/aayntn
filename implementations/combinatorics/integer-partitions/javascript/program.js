// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Euler's recurrence for the partition function, driven from standard input.
 *
 * Input: one integer n. Output: p(n) modulo 1000000007.
 */

const MODULUS = 1000000007;

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n < 0) {
        return;
    }

    const partitions = new Int32Array(n + 1);
    partitions[0] = 1;

    for (let i = 1; i <= n; i += 1) {
        let total = 0;
        for (let k = 1; ; k += 1) {
            const first = (k * (3 * k - 1)) / 2;
            if (first > i) {
                break;
            }
            const second = (k * (3 * k + 1)) / 2;
            if (k % 2 === 1) {
                total += partitions[i - first];
                if (total >= MODULUS) {
                    total -= MODULUS;
                }
                if (second <= i) {
                    total += partitions[i - second];
                    if (total >= MODULUS) {
                        total -= MODULUS;
                    }
                }
            } else {
                total -= partitions[i - first];
                if (total < 0) {
                    total += MODULUS;
                }
                if (second <= i) {
                    total -= partitions[i - second];
                    if (total < 0) {
                        total += MODULUS;
                    }
                }
            }
        }
        partitions[i] = total;
    }

    process.stdout.write(String(partitions[n]) + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
