#include <stdio.h>
#include <stdlib.h>

/*
 * Sorts weights in nondecreasing order. The comparison is a three-way
 * comparison rather than a subtraction, so no difference can overflow.
 */
static int compare_weights(const void *left, const void *right) {
    long long x = *(const long long *)left;
    long long y = *(const long long *)right;
    return (x > y) - (x < y);
}

int main(void) {
    int n = 0;
    long long capacity = 0;
    if (scanf("%d %lld", &n, &capacity) != 2) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n");
        return 0;
    }

    long long *weights = malloc((size_t)n * sizeof *weights);
    if (weights == NULL) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%lld", &weights[i]) != 1) {
            free(weights);
            return 0;
        }
    }

    qsort(weights, (size_t)n, sizeof *weights, compare_weights);

    /* Sorted order: once a weight does not fit, no later weight fits. */
    long long used = 0;
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (weights[i] > capacity - used) {
            break;
        }
        used += weights[i];
        count++;
    }

    printf("%d\n", count);
    free(weights);
    return 0;
}
