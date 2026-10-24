#include <stdio.h>
#include <stdlib.h>

/*
 * Deterministic quickselect: the median of the first, middle, and last value
 * is the pivot, and a three-way partition removes every copy of it at once.
 * The rank is zero-based inside, so the k-th smallest element is target k - 1.
 */

static void swap_values(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

static int median_of_three(const int *a, int lo, int mid, int hi) {
    int x = a[lo];
    int y = a[mid];
    int z = a[hi];
    if (x > y) {
        swap_values(&x, &y);
    }
    if (y > z) {
        swap_values(&y, &z);
    }
    if (x > y) {
        swap_values(&x, &y);
    }
    return y;
}

static int select_kth(int *a, int n, int k) {
    int lo = 0;
    int hi = n - 1;
    int target = k - 1;

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int pivot = median_of_three(a, lo, mid, hi);
        int lt = lo;
        int i = lo;
        int gt = hi;

        while (i <= gt) {
            if (a[i] < pivot) {
                swap_values(&a[lt], &a[i]);
                lt++;
                i++;
            } else if (a[i] > pivot) {
                swap_values(&a[i], &a[gt]);
                gt--;
            } else {
                i++;
            }
        }

        if (target < lt) {
            hi = lt - 1;
        } else if (target > gt) {
            lo = gt + 1;
        } else {
            return pivot;
        }
    }

    return a[lo];
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    int *a = malloc((size_t)n * sizeof(int));
    if (a == NULL) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &a[i]) != 1) {
            free(a);
            return 0;
        }
    }

    int k = 0;
    if (scanf("%d", &k) != 1 || k < 1 || k > n) {
        free(a);
        return 0;
    }

    printf("%d\n", select_kth(a, n, k));
    free(a);
    return 0;
}
