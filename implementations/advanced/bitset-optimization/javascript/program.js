// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Subset-sum reachability over 32-bit words, driven from standard input.
 *
 * Input: n, the limit W, then n positive weights. Output: the number of
 * distinct subset sums at most W, counting the empty subset as 0.
 */

const WORD_BITS = 32;

// The compiled languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {number} value a 32-bit word
 * @returns {number} the number of set bits
 */
function popcount32(value) {
    let v = value >>> 0;
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    v = (v + (v >>> 4)) & 0x0f0f0f0f;
    v = (v + (v >>> 8)) & 0x00ff00ff;
    v = (v + (v >>> 16)) & 0x0000ffff;
    return v;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let at = 0;
    const n = Number(tokens[at]);
    at += 1;
    const limit = Number(tokens[at]);
    at += 1;

    const words = Math.floor(limit / WORD_BITS) + 1;
    const topBits = (limit % WORD_BITS) + 1;
    const reachable = new Uint32Array(words);
    reachable[0] = 1;

    for (let k = 0; k < n; k += 1) {
        if (at >= tokens.length) {
            break;
        }
        const weight = Number(tokens[at]);
        at += 1;
        if (weight <= 0 || weight > limit) {
            continue;
        }

        const wordShift = Math.floor(weight / WORD_BITS);
        const bitShift = weight % WORD_BITS;

        for (let i = words - 1; i >= wordShift; i -= 1) {
            let moved = (reachable[i - wordShift] << bitShift) >>> 0;
            if (bitShift > 0 && i - wordShift - 1 >= 0) {
                moved = (moved | (reachable[i - wordShift - 1] >>> (WORD_BITS - bitShift))) >>> 0;
            }
            reachable[i] = (reachable[i] | moved) >>> 0;
        }

        if (topBits < WORD_BITS) {
            reachable[words - 1] &= (1 << topBits) - 1;
        }
    }

    let answer = 0;
    for (let i = 0; i < words; i += 1) {
        answer += popcount32(reachable[i]);
    }
    process.stdout.write(String(answer) + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
