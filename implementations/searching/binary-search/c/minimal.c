#include <stdlib.h>

/*
 * Binary search over a sorted array.
 *
 * Contract: a[0 .. n-1] is sorted in non-decreasing order and the search
 * interval is inclusive on both ends, so an empty interval is the only
 * base case. Returns the 0-based index of an element equal to target, or
 * -1 when the target is absent.
 *
 * The caller owns the array; the function allocates nothing.
 */
long long binary_search(const long long *a, int n, long long target)
{
    int lo = 0;
    int hi = n - 1;

    while (lo <= hi) {
        /* lo + (hi - lo) / 2 cannot overflow the way (lo + hi) / 2 can. */
        int mid = lo + (hi - lo) / 2;

        if (a[mid] == target) {
            return mid;
        }
        if (a[mid] < target) {
            lo = mid + 1; /* every element at or below mid is too small */
        } else {
            hi = mid - 1; /* every element at or above mid is too large */
        }
    }
    return -1;
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void)
{
    const long long sample[] = {1, 3, 5, 7};

    if (binary_search(sample, 4, 5) != 2) {
        return EXIT_FAILURE;
    }
    if (binary_search(sample, 4, 6) != -1) {
        return EXIT_FAILURE;
    }
    if (binary_search(sample, 0, 5) != -1) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
