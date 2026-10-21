#include <stdlib.h>

/*
 * Prefix sums over an array of values.
 *
 * Contract: on return prefix[0] = 0 and prefix[i] = prefix[i-1] + a[i-1]
 * for every 1 <= i <= n, so the sum of a[l-1 .. r-1] is
 * prefix[r] - prefix[l-1].
 *
 * Ownership: the caller owns both buffers. prefix must have room for
 * n+1 elements; the function allocates nothing and frees nothing.
 */
void prefix_sums(const long long *a, int n, long long *prefix)
{
    prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + a[i];
    }
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void)
{
    const long long sample[] = {1, 2, 3, 4, 5};
    long long prefix[6];

    prefix_sums(sample, 5, prefix);
    if (prefix[0] != 0 || prefix[1] != 1 || prefix[5] != 15) {
        return EXIT_FAILURE;
    }
    /* A range sum is the difference of two prefix entries. */
    if (prefix[3] - prefix[1] != 5) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
