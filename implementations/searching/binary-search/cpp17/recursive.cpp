#include <cstdlib>
#include <vector>

/*
 * Recursive binary search.
 *
 * Contract: a is sorted in non-decreasing order, the interval [lo, hi] is
 * inclusive on both ends, and the result is the 0-based index of an element
 * equal to target, or -1 when the target is absent.
 *
 * Every call halves the interval, so the call stack holds one frame per
 * halving: the depth grows with the array size.
 */
int binary_search_recursive(const std::vector<long long>& a, int lo, int hi, long long target)
{
    if (lo > hi) {
        return -1;
    }

    /* lo + (hi - lo) / 2 cannot overflow the way (lo + hi) / 2 can. */
    const int mid = lo + (hi - lo) / 2;

    if (a[mid] == target) {
        return mid;
    }
    if (a[mid] < target) {
        return binary_search_recursive(a, mid + 1, hi, target);
    }
    return binary_search_recursive(a, lo, mid - 1, target);
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main()
{
    const std::vector<long long> sample{1, 3, 5, 7};

    if (binary_search_recursive(sample, 0, 3, 5) != 2) {
        return EXIT_FAILURE;
    }
    if (binary_search_recursive(sample, 0, 3, 6) != -1) {
        return EXIT_FAILURE;
    }
    if (binary_search_recursive(sample, 0, -1, 5) != -1) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
