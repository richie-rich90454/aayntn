/*
 * Randomized quicksort with a three-way partition and a xorshift32 generator.
 * The generator is seeded with 2463534242 so that the six language variants
 * take the same pivots and report the same comparison count.
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static uint32_t rng_state = 2463534242u;
static long long comparisons = 0;

static uint32_t next_random(void) {
    uint32_t x = rng_state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    rng_state = x;
    return x;
}

static void swap_values(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

static void randomized_quicksort(int *a, int lo, int hi) {
    if (lo >= hi) return;

    int pivot = a[lo + (int)(next_random() % (uint32_t)(hi - lo + 1))];
    int lt = lo;
    int i = lo;
    int gt = hi;

    while (i <= gt) {
        ++comparisons;
        if (a[i] < pivot) {
            swap_values(&a[lt], &a[i]);
            ++lt;
            ++i;
        } else if (a[i] > pivot) {
            swap_values(&a[i], &a[gt]);
            --gt;
        } else {
            ++i;
        }
    }

    randomized_quicksort(a, lo, lt - 1);
    randomized_quicksort(a, gt + 1, hi);
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;

    int *a = malloc((size_t)n * sizeof *a);
    if (a == NULL) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d", &a[i]) != 1) {
            free(a);
            return 1;
        }
    }

    randomized_quicksort(a, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i > 0) putchar(' ');
        printf("%d", a[i]);
    }
    putchar('\n');
    printf("%lld\n", comparisons);

    free(a);
    return 0;
}
