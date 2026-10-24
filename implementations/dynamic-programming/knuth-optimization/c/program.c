#include <stdio.h>
#include <stdlib.h>

/*
 * Matrix chain multiplication with the monotone split window.
 *
 * Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
 * p[i] by p[i + 1], for 0 <= i < n.
 * Output: the minimum number of scalar multiplications.
 *
 * The split for a range [i, j] is only searched in
 * [opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic
 * interval table into a quadratic one.
 */
int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n");
        return 0;
    }

    long long *p = malloc((size_t)(n + 1) * sizeof *p);
    long long *dp = calloc((size_t)n * (size_t)n, sizeof *dp);
    int *opt = malloc((size_t)n * (size_t)n * sizeof *opt);
    if (p == NULL || dp == NULL || opt == NULL) {
        free(p);
        free(dp);
        free(opt);
        return 0;
    }

    for (int i = 0; i <= n; i++) {
        if (scanf("%lld", &p[i]) != 1) {
            p[i] = 1;
        }
    }
    for (int i = 0; i < n; i++) {
        opt[(size_t)i * n + i] = i;
    }

    for (int length = 2; length <= n; length++) {
        for (int i = 0; i + length <= n; i++) {
            const int j = i + length - 1;
            int lo = opt[(size_t)i * n + (j - 1)];
            int hi = opt[(size_t)(i + 1) * n + j];
            if (lo < i) {
                lo = i;
            }
            if (hi > j - 1) {
                hi = j - 1;
            }
            if (lo > hi) {
                lo = i;
                hi = j - 1;
            }

            long long best = -1;
            int best_k = lo;
            for (int k = lo; k <= hi; k++) {
                const long long cost = dp[(size_t)i * n + k] +
                                       dp[(size_t)(k + 1) * n + j] +
                                       p[i] * p[k + 1] * p[j + 1];
                if (best < 0 || cost < best) {
                    best = cost;
                    best_k = k;
                }
            }
            dp[(size_t)i * n + j] = best;
            opt[(size_t)i * n + j] = best_k;
        }
    }

    printf("%lld\n", dp[n - 1]);
    free(p);
    free(dp);
    free(opt);
    return 0;
}
