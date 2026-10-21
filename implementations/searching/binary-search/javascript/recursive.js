"use strict";

/*
 * Educational reference implementation. JavaScript is not a USACO submission
 * language; this listing exists so that the algorithm can be read in a
 * scripting runtime, not so that it can be submitted.
 */
/**
 * Recursive binary search.
 *
 * Contract: `a` is sorted in non-decreasing order, the interval `[lo, hi]` is
 * inclusive on both ends, and the result is the 0-based index of an element
 * equal to `target`, or -1 when the target is absent.
 *
 * Every call halves the interval, so the call stack holds one frame per
 * halving: the depth grows with the array size.
 */
function binarySearchRecursive(a, lo, hi, target) {
    if (lo > hi) {
        return -1;
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) {
        return mid;
    }
    if (a[mid] < target) {
        return binarySearchRecursive(a, mid + 1, hi, target);
    }
    return binarySearchRecursive(a, lo, mid - 1, target);
}

// Self-check: the routine above is the reusable part, so this file asserts the
// documented contract instead of reading input.
const sample = [1, 3, 5, 7];
if (
    binarySearchRecursive(sample, 0, 3, 5) !== 2 ||
    binarySearchRecursive(sample, 0, 3, 6) !== -1 ||
    binarySearchRecursive(sample, 0, -1, 5) !== -1
) {
    throw new Error("recursive binary search self-check failed");
}
