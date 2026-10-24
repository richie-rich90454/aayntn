#include <stdio.h>
#include <stdlib.h>

/*
 * A wavelet tree over a static array, stored level by level (the layout is
 * also called a wavelet matrix). Every level keeps a prefix count of the
 * elements that descend to the left child, and the values are stable
 * partitioned before the next level. A k-th smallest query descends one level
 * at a time and never touches a value it does not need.
 *
 * Input: n q, then the n values, then q lines "l r k" with 0-based half-open
 * bounds [l, r). Output: one line per query, holding the k-th smallest value
 * in a[l..r).
 */

static int compareInt64(const void *left, const void *right) {
    const long long a = *(const long long *)left;
    const long long b = *(const long long *)right;
    return (a > b) - (a < b);
}

static int lowerBound(const long long *values, int size, long long target) {
    int low = 0;
    int high = size;
    while (low < high) {
        const int middle = low + (high - low) / 2;
        if (values[middle] < target) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    long long *values = (long long *)malloc((size_t)n * sizeof(long long));
    long long *sorted = (long long *)malloc((size_t)n * sizeof(long long));
    if (values == NULL || sorted == NULL) {
        free(values);
        free(sorted);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld", &values[i]) != 1) {
            free(values);
            free(sorted);
            return 0;
        }
        sorted[i] = values[i];
    }

    qsort(sorted, (size_t)n, sizeof(long long), compareInt64);

    int distinct = 0;
    for (int i = 0; i < n; i++) {
        if (i == 0 || sorted[i] != sorted[distinct - 1]) {
            sorted[distinct] = sorted[i];
            distinct += 1;
        }
    }

    int *cur = (int *)malloc((size_t)n * sizeof(int));
    int *next = (int *)malloc((size_t)n * sizeof(int));
    if (cur == NULL || next == NULL) {
        free(cur);
        free(next);
        free(values);
        free(sorted);
        return 0;
    }
    for (int i = 0; i < n; i++) {
        cur[i] = lowerBound(sorted, distinct, values[i]);
    }

    int bits = 0;
    while ((1 << bits) < distinct) {
        bits += 1;
    }

    int **prefix = NULL;
    int *zeroCount = NULL;
    if (bits > 0) {
        prefix = (int **)malloc((size_t)bits * sizeof(int *));
        zeroCount = (int *)malloc((size_t)bits * sizeof(int));
        if (prefix == NULL || zeroCount == NULL) {
            free(prefix);
            free(zeroCount);
            free(cur);
            free(next);
            free(values);
            free(sorted);
            return 0;
        }
    }

    for (int level = 0; level < bits; level++) {
        const int shift = bits - 1 - level;
        prefix[level] = (int *)malloc((size_t)(n + 1) * sizeof(int));
        if (prefix[level] == NULL) {
            for (int done = 0; done < level; done++) {
                free(prefix[done]);
            }
            free(prefix);
            free(zeroCount);
            free(cur);
            free(next);
            free(values);
            free(sorted);
            return 0;
        }

        prefix[level][0] = 0;
        int zeros = 0;
        for (int i = 0; i < n; i++) {
            if (((cur[i] >> shift) & 1) == 0) {
                zeros += 1;
            }
            prefix[level][i + 1] = zeros;
        }
        zeroCount[level] = zeros;

        int zeroPosition = 0;
        int onePosition = zeros;
        for (int i = 0; i < n; i++) {
            if (((cur[i] >> shift) & 1) == 0) {
                next[zeroPosition] = cur[i];
                zeroPosition += 1;
            } else {
                next[onePosition] = cur[i];
                onePosition += 1;
            }
        }

        int *swap = cur;
        cur = next;
        next = swap;
    }

    for (int query = 0; query < q; query++) {
        int left = 0;
        int right = 0;
        long long k = 0;
        if (scanf("%d %d %lld", &left, &right, &k) != 3) {
            break;
        }

        int rank = 0;
        for (int level = 0; level < bits; level++) {
            const int zerosLeft = prefix[level][left];
            const int zerosRight = prefix[level][right];
            const int zeros = zerosRight - zerosLeft;
            if (k <= (long long)zeros) {
                left = zerosLeft;
                right = zerosRight;
                rank <<= 1;
            } else {
                k -= (long long)zeros;
                const int base = zeroCount[level];
                left = base + (left - zerosLeft);
                right = base + (right - zerosRight);
                rank = (rank << 1) | 1;
            }
        }
        printf("%lld\n", sorted[rank]);
    }

    for (int level = 0; level < bits; level++) {
        free(prefix[level]);
    }
    free(prefix);
    free(zeroCount);
    free(cur);
    free(next);
    free(values);
    free(sorted);
    return 0;
}
