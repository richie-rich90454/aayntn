#include <stdio.h>
#include <stdlib.h>

/*
 * Prefix sums driver.
 *
 * Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints one range sum per line.
 */

/*
 * Fills prefix[0 .. n] with the running totals of a[0 .. n-1]. The caller
 * owns the buffer, which must have room for n+1 elements.
 */
static void prefix_sums(const long long *a, int n, long long *prefix)
{
    prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + a[i];
    }
}

int main(void)
{
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    /* calloc zeroes the values, so a truncated input leaves zeros behind
       instead of reading uninitialised memory. */
    long long *a = calloc((size_t)n + 1, sizeof *a);
    long long *prefix = calloc((size_t)n + 1, sizeof *prefix);
    if (a == NULL || prefix == NULL) {
        free(a);
        free(prefix);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld", &a[i]) != 1) {
            break;
        }
    }
    prefix_sums(a, n, prefix);

    int q = 0;
    if (scanf("%d", &q) != 1) {
        q = 0;
    }
    if (q < 0) {
        q = 0;
    }

    for (int j = 0; j < q; j++) {
        int l = 0;
        int r = 0;
        if (scanf("%d %d", &l, &r) != 2) {
            break;
        }
        /* A range that leaves the array is clipped, so the lookup stays in
           bounds; a range that is empty after clipping sums to zero. */
        if (l < 1) {
            l = 1;
        }
        if (r > n) {
            r = n;
        }
        if (l > r) {
            printf("0\n");
            continue;
        }
        printf("%lld\n", prefix[r] - prefix[l - 1]);
    }

    free(a);
    free(prefix);
    return 0;
}
