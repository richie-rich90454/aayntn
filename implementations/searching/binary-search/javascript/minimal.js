"use strict";

/*
 * Educational reference implementation. JavaScript is not a USACO submission
 * language; this listing exists so that the algorithm can be read in a
 * scripting runtime, not so that it can be submitted.
 */
/**
 * Binary search over a sorted array.
 *
 * Contract: `a` is sorted in non-decreasing order and the search interval is
 * inclusive on both ends, so an empty array is the only base case. Returns the
 * 0-based index of an element equal to `target`, or -1 when the target is
 * absent.
 *
 * The caller keeps ownership of the array; the function does not copy it.
 */
function binarySearch(a, target) {
    let lo = 0;
    let hi = a.length - 1;
    while (lo <= hi) {
        // lo + Math.floor((hi - lo) / 2) stays inside the interval.
        const mid = lo + Math.floor((hi - lo) / 2);
        if (a[mid] === target) {
            return mid;
        }
        if (a[mid] < target) {
            lo = mid + 1; // every element at or below mid is too small
        } else {
            hi = mid - 1; // every element at or above mid is too large
        }
    }
    return -1;
}

// Self-check: the routine above is the reusable part, so this file asserts the
// documented contract instead of reading input.
const sample = [1, 3, 5, 7];
if (binarySearch(sample, 5) !== 2 || binarySearch(sample, 6) !== -1 || binarySearch([], 5) !== -1) {
    throw new Error("binary search self-check failed");
}
