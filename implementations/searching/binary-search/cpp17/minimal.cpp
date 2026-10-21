#include <cstdlib>
#include <vector>

/*
 * Binary search over a sorted vector.
 *
 * Contract: a is sorted in non-decreasing order and the search interval is
 * inclusive on both ends, so an empty vector is the only base case.
 * Returns the 0-based index of an element equal to target, or -1 when the
 * target is absent.
 */
int binary_search(const std::vector<long long>& a, long long target)
{
    int lo = 0;
    int hi = static_cast<int>(a.size()) - 1;

    while (lo <= hi) {
        /* lo + (hi - lo) / 2 cannot overflow the way (lo + hi) / 2 can. */
        const int mid = lo + (hi - lo) / 2;

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
int main()
{
    const std::vector<long long> sample{1, 3, 5, 7};

    if (binary_search(sample, 5) != 2) {
        return EXIT_FAILURE;
    }
    if (binary_search(sample, 6) != -1) {
        return EXIT_FAILURE;
    }
    if (binary_search(std::vector<long long>(), 5) != -1) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
