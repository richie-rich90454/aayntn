// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/*
 * Randomized quicksort with a three-way partition and a xorshift32 generator.
 * The generator is seeded with 2463534242 so that the six language variants
 * take the same pivots and report the same comparison count.
 */

import { readFileSync } from "node:fs";

const EOL = process.platform === "win32" ? "\r\n" : "\n";

let rngState = 2463534242;
let comparisons = 0;

function nextRandom() {
    let x = rngState;
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    rngState = x;
    return x;
}

function randomizedQuicksort(a, lo, hi) {
    if (lo >= hi) return;

    const pivot = a[lo + (nextRandom() % (hi - lo + 1))];
    let lt = lo;
    let i = lo;
    let gt = hi;

    while (i <= gt) {
        comparisons += 1;
        if (a[i] < pivot) {
            [a[lt], a[i]] = [a[i], a[lt]];
            lt += 1;
            i += 1;
        } else if (a[i] > pivot) {
            [a[i], a[gt]] = [a[gt], a[i]];
            gt -= 1;
        } else {
            i += 1;
        }
    }

    randomizedQuicksort(a, lo, lt - 1);
    randomizedQuicksort(a, gt + 1, hi);
}

function main() {
    const tokens = readFileSync(0, "utf8")
        .split(/\s+/)
        .filter((token) => token.length > 0);
    if (tokens.length === 0) return;

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n <= 0) return;

    const a = tokens.slice(1, 1 + n).map(Number);
    randomizedQuicksort(a, 0, n - 1);
    process.stdout.write(a.join(" ") + EOL + comparisons + EOL);
}

main();
