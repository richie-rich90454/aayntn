#include <stdio.h>
#include <stdlib.h>

/*
 * Square-root decomposition over a 1-indexed array. The array is cut into
 * blocks of about sqrt(n) positions, and sum[b] holds the total of block b.
 */
int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    /* ceil(sqrt(n)) without floating point; n is at least 0. */
    int block = 1;
    while ((long long)block * block < n) {
        block += 1;
    }
    int blocks = (n + block - 1) / block;

    /* The guards keep calloc away from a zero size and let n = 0 work. */
    long long *value = calloc(n > 0 ? (size_t)n : 1, sizeof *value);
    long long *sum = calloc(blocks > 0 ? (size_t)blocks : 1, sizeof *sum);
    if (value == NULL || sum == NULL) {
        free(value);
        free(sum);
        return 0;
    }

    for (int k = 0; k < q; k++) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int index = 0;
            long long delta = 0;
            if (scanf("%d %lld", &index, &delta) != 2) {
                break;
            }
            index -= 1;
            if (index >= 0 && index < n) {
                value[index] += delta;
                sum[index / block] += delta;
            }
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            left -= 1;
            right -= 1;
            if (left < 0) {
                left = 0;
            }
            if (right >= n) {
                right = n - 1;
            }

            long long total = 0;
            if (left <= right) {
                int first_full = (left + block - 1) / block;
                int last_full = (right + 1) / block - 1;
                if (first_full > last_full) {
                    /* The range lies inside one block, or in two partial ones. */
                    for (int i = left; i <= right; i++) {
                        total += value[i];
                    }
                } else {
                    for (int i = left; i < first_full * block; i++) {
                        total += value[i];
                    }
                    for (int b = first_full; b <= last_full; b++) {
                        total += sum[b];
                    }
                    for (int i = (last_full + 1) * block; i <= right; i++) {
                        total += value[i];
                    }
                }
            }
            printf("%lld\n", total);
        } else {
            break;
        }
    }

    free(value);
    free(sum);
    return 0;
}
