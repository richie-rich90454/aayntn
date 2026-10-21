"use strict";

/**
 * Prefix sums over an array of values.
 *
 * Contract: the returned array holds a.length + 1 entries with prefix[0] = 0n
 * and prefix[i] = prefix[i-1] + a[i-1] for every 1 <= i <= n, so the sum of
 * a[l-1 .. r-1] is prefix[r] - prefix[l-1].
 *
 * The caller keeps ownership of the array; the function does not copy it.
 *
 * The sums are BigInt because the documented range reaches 10^15 and the
 * prefix sums must stay exact; a double would lose the low bits.
 */
function prefixSums(a) {
    const prefix = new Array(a.length + 1);
    prefix[0] = 0n;
    for (let i = 0; i < a.length; i += 1) {
        prefix[i + 1] = prefix[i] + a[i];
    }
    return prefix;
}

// Self-check: the routine above is the reusable part, so this file asserts the
// documented contract instead of reading input.
const prefix = prefixSums([1n, 2n, 3n, 4n, 5n]);
if (prefix[0] !== 0n || prefix[1] !== 1n || prefix[5] !== 15n) {
    throw new Error("unexpected prefix sums");
}
// A range sum is the difference of two prefix entries.
if (prefix[3] - prefix[1] !== 5n) {
    throw new Error("unexpected range sum");
}
