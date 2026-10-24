// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * XOR basis over 30 bits, driven from standard input.
 *
 * Input: n, then n values, then q, then q query values. Output: for each query
 * x, the maximum of x XOR a subset XOR of the values.
 */

const BITS = 30;

// The compiled languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 1) {
        return;
    }

    let index = 0;
    const n = Number(tokens[index]);
    index += 1;
    const basis = new Array(BITS).fill(0);
    for (let k = 0; k < n; k += 1) {
        let value = Number(tokens[index]);
        index += 1;
        for (let bit = BITS - 1; bit >= 0; bit -= 1) {
            if (((value >>> bit) & 1) === 0) {
                continue;
            }
            if (basis[bit] !== 0) {
                value ^= basis[bit];
            } else {
                basis[bit] = value;
                break;
            }
        }
    }

    if (index >= tokens.length) {
        return;
    }
    const q = Number(tokens[index]);
    index += 1;
    const lines = [];
    for (let k = 0; k < q; k += 1) {
        if (index >= tokens.length) {
            break;
        }
        let x = Number(tokens[index]);
        index += 1;
        for (let bit = BITS - 1; bit >= 0; bit -= 1) {
            if (basis[bit] !== 0 && (x ^ basis[bit]) > x) {
                x ^= basis[bit];
            }
        }
        lines.push(String(x));
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join(EOL) + EOL);
    }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
