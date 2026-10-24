// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * A wavelet tree over a static array, stored level by level (the layout is
 * also called a wavelet matrix).
 *
 * Every level keeps a prefix count of the elements that descend to the left
 * child, and the values are stable partitioned before the next level. A k-th
 * smallest query descends one level at a time.
 *
 * Input: n q, then the n values, then q lines "l r k" with 0-based half-open
 * bounds [l, r). Output: one line per query, holding the k-th smallest value
 * in a[l..r).
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Number(tokens[0]);
    const q = Number(tokens[1]);
    if (n <= 0) {
        return;
    }

    const values = tokens.slice(2, 2 + n).map(Number);
    const sortedValues = Array.from(new Set(values)).sort((a, b) => a - b);
    const rankOf = new Map();
    for (let i = 0; i < sortedValues.length; i += 1) {
        rankOf.set(sortedValues[i], i);
    }
    const distinct = sortedValues.length;
    let bits = 0;
    while (2 ** bits < distinct) {
        bits += 1;
    }

    let cur = Int32Array.from(values, (value) => rankOf.get(value));
    let next = new Int32Array(n);
    const prefix = new Array(bits);
    const zeroCount = new Int32Array(bits);

    for (let level = 0; level < bits; level += 1) {
        const shift = bits - 1 - level;
        const pref = new Int32Array(n + 1);
        let zeros = 0;
        for (let i = 0; i < n; i += 1) {
            if (((cur[i] >> shift) & 1) === 0) {
                zeros += 1;
            }
            pref[i + 1] = zeros;
        }
        prefix[level] = pref;
        zeroCount[level] = zeros;

        let zeroPosition = 0;
        let onePosition = zeros;
        for (let i = 0; i < n; i += 1) {
            const value = cur[i];
            if (((value >> shift) & 1) === 0) {
                next[zeroPosition] = value;
                zeroPosition += 1;
            } else {
                next[onePosition] = value;
                onePosition += 1;
            }
        }
        const swap = cur;
        cur = next;
        next = swap;
    }

    const answers = [];
    let position = 2 + n;
    for (let query = 0; query < q; query += 1) {
        let left = Number(tokens[position]);
        let right = Number(tokens[position + 1]);
        let k = Number(tokens[position + 2]);
        position += 3;

        let rank = 0;
        for (let level = 0; level < bits; level += 1) {
            const pref = prefix[level];
            const zerosLeft = pref[left];
            const zerosRight = pref[right];
            const zeros = zerosRight - zerosLeft;
            if (k <= zeros) {
                left = zerosLeft;
                right = zerosRight;
                rank <<= 1;
            } else {
                k -= zeros;
                const base = zeroCount[level];
                left = base + (left - zerosLeft);
                right = base + (right - zerosRight);
                rank = (rank << 1) | 1;
            }
        }
        answers.push(String(sortedValues[rank]));
    }

    if (answers.length > 0) {
        process.stdout.write(answers.join(EOL) + EOL);
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
