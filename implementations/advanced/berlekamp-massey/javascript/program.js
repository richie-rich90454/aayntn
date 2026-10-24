// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Berlekamp-Massey over the prime field modulo 1000000007.
 *
 * The program reads a prefix of a sequence and prints the order of its
 * shortest linear recurrence and the next term. The coefficients are BigInt,
 * because a product of two residues near 10^9 is not exactly representable as
 * a double.
 */

const MODULO = 1000000007n;
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {bigint} base
 * @param {bigint} exponent
 * @returns {bigint}
 */
function powerMod(base, exponent) {
    let result = 1n;
    let value = base % MODULO;
    let e = exponent;
    while (e > 0n) {
        if ((e & 1n) === 1n) {
            result = (result * value) % MODULO;
        }
        value = (value * value) % MODULO;
        e >>= 1n;
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

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n <= 0 || tokens.length < n + 1) {
        return;
    }

    const sequence = [];
    for (let i = 0; i < n; i += 1) {
        let value = BigInt(tokens[i + 1]) % MODULO;
        if (value < 0n) {
            value += MODULO;
        }
        sequence.push(value);
    }

    const current = [1n];
    let backup = [1n];
    let order = 0;
    let shift = 1;
    let lastDiscrepancy = 1n;

    for (let i = 0; i < n; i += 1) {
        let discrepancy = 0n;
        const limit = Math.min(order, i);
        for (let j = 0; j <= limit; j += 1) {
            discrepancy = (discrepancy + current[j] * sequence[i - j]) % MODULO;
        }
        if (discrepancy === 0n) {
            shift += 1;
            continue;
        }

        const saved = current.slice();
        const coefficient = (discrepancy * powerMod(lastDiscrepancy, MODULO - 2n)) % MODULO;
        while (current.length < backup.length + shift) {
            current.push(0n);
        }
        for (let j = 0; j < backup.length; j += 1) {
            current[j + shift] =
                (current[j + shift] - ((coefficient * backup[j]) % MODULO) + MODULO) % MODULO;
        }

        if (2 * order <= i) {
            order = i + 1 - order;
            backup = saved;
            lastDiscrepancy = discrepancy;
            shift = 1;
        } else {
            shift += 1;
        }
    }

    let nextTerm = 0n;
    for (let j = 1; j <= order && j <= n; j += 1) {
        nextTerm = (nextTerm + current[j] * sequence[n - j]) % MODULO;
    }
    if (nextTerm !== 0n) {
        nextTerm = MODULO - nextTerm;
    }

    process.stdout.write(`${order} ${nextTerm}${EOL}`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
