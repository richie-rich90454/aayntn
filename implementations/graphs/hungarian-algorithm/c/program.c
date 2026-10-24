#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n\n");
        return 0;
    }

    const long long infinity = LLONG_MAX / 4;
    long long *cost = (long long *)malloc((size_t)n * (size_t)n * sizeof(long long));
    long long *u = (long long *)calloc((size_t)n + 1, sizeof(long long));
    long long *v = (long long *)calloc((size_t)n + 1, sizeof(long long));
    long long *minv = (long long *)malloc(((size_t)n + 1) * sizeof(long long));
    int *p = (int *)calloc((size_t)n + 1, sizeof(int));
    int *way = (int *)calloc((size_t)n + 1, sizeof(int));
    int *used = (int *)calloc((size_t)n + 1, sizeof(int));
    int *assignment = (int *)calloc((size_t)n, sizeof(int));
    if (cost == NULL || u == NULL || v == NULL || minv == NULL || p == NULL ||
        way == NULL || used == NULL || assignment == NULL) {
        return 1;
    }

    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (scanf("%lld", &cost[(size_t)i * (size_t)n + (size_t)j]) != 1) {
                return 1;
            }
        }
    }

    /* Row minima are feasible dual potentials for costs of either sign. */
    for (int i = 1; i <= n; ++i) {
        u[i] = cost[(size_t)(i - 1) * (size_t)n];
        for (int j = 1; j < n; ++j) {
            long long value = cost[(size_t)(i - 1) * (size_t)n + (size_t)j];
            if (value < u[i]) {
                u[i] = value;
            }
        }
    }

    for (int i = 1; i <= n; ++i) {
        p[0] = i;
        int j0 = 0;
        for (int j = 0; j <= n; ++j) {
            minv[j] = infinity;
            used[j] = 0;
            way[j] = 0;
        }
        do {
            used[j0] = 1;
            int i0 = p[j0];
            long long delta = infinity;
            int j1 = 0;
            for (int j = 1; j <= n; ++j) {
                if (used[j]) {
                    continue;
                }
                long long cur = cost[(size_t)(i0 - 1) * (size_t)n + (size_t)(j - 1)] -
                                u[i0] - v[j];
                if (cur < minv[j]) {
                    minv[j] = cur;
                    way[j] = j0;
                }
                if (minv[j] < delta) {
                    delta = minv[j];
                    j1 = j;
                }
            }
            for (int j = 0; j <= n; ++j) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            j0 = j1;
        } while (p[j0] != 0);
        do {
            int j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0 != 0);
    }

    for (int j = 1; j <= n; ++j) {
        assignment[p[j] - 1] = j - 1;
    }
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        total += cost[(size_t)i * (size_t)n + (size_t)assignment[i]];
    }

    printf("%lld\n", total);
    for (int i = 0; i < n; ++i) {
        if (i > 0) {
            printf(" ");
        }
        printf("%d", assignment[i]);
    }
    printf("\n");
    return 0;
}
