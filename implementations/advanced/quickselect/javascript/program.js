// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Deterministic quickselect over a signed 32-bit array.
 *
 * Input: n, then n values, then k. Output: the k-th smallest value. The pivot
 * is the median of the first, middle, and last value, and a three-way
 * partition removes every copy of it in one pass.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {number[]} a
 * @param {number} lo
 * @param {number} mid
 * @param {number} hi
 * @returns {number}
 */
function medianOfThree(a, lo, mid, hi) {
    let x = a[lo];
    let y = a[mid];
    let z = a[hi];
    if (x > y) {
        const temporary = x;
        x = y;
        y = temporary;
    }
    if (y > z) {
        const temporary = y;
        y = z;
        z = temporary;
    }
    if (x > y) {
        const temporary = x;
        x = y;
        y = temporary;
    }
    return y;
}

/**
 * @param {number[]} a
 * @param {number} k the 1-based rank
 * @returns {number}
 */
function select(a, k) {
    let lo = 0;
    let hi = a.length - 1;
    const target = k - 1;

    while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const pivot = medianOfThree(a, lo, mid, hi);
        let lt = lo;
        let i = lo;
        let gt = hi;

        while (i <= gt) {
            if (a[i] < pivot) {
                const temporary = a[lt];
                a[lt] = a[i];
                a[i] = temporary;
                lt += 1;
                i += 1;
            } else if (a[i] > pivot) {
                const temporary = a[i];
                a[i] = a[gt];
                a[gt] = temporary;
                gt -= 1;
            } else {
                i += 1;
            }
        }

        if (target < lt) {
            hi = lt - 1;
        } else if (target > gt) {
            lo = gt + 1;
        } else {
            return pivot;
        }
    }

    return a[lo];
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let index = 0;
    const n = Number(tokens[index]);
    index += 1;
    if (!Number.isInteger(n) || n <= 0 || index + n > tokens.length) {
        return;
    }

    const a = [];
    for (let position = 0; position < n; position += 1) {
        a.push(Number(tokens[index]));
        index += 1;
    }

    if (index >= tokens.length) {
        return;
    }
    const k = Number(tokens[index]);
    if (!Number.isInteger(k) || k < 1 || k > n) {
        return;
    }

    process.stdout.write(String(select(a, k)) + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
