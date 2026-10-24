#include <stdio.h>
#include <stdlib.h>

// Counts the pairs i < j with values[i] + values[j] <= target.
// The values are given in non-decreasing order.

int main(void)
{
    int n;

    if (scanf("%d", &n) != 1 || n < 0) {
        printf("0\n");
        return EXIT_SUCCESS;
    }

    long long *values = NULL;

    if (n > 0) {
        values = malloc(sizeof(long long) * (size_t)n);
        if (values == NULL) {
            return EXIT_FAILURE;
        }
    }

    for (int i = 0; i < n; ++i) {
        if (scanf("%lld", &values[i]) != 1) {
            free(values);
            printf("0\n");
            return EXIT_SUCCESS;
        }
    }

    long long target;

    if (scanf("%lld", &target) != 1) {
        free(values);
        printf("0\n");
        return EXIT_SUCCESS;
    }

    long long total = 0;
    int left = 0;
    int right = n - 1;

    while (left < right) {
        if (values[left] + values[right] <= target) {
            total += (long long)(right - left);
            ++left;
        } else {
            --right;
        }
    }

    free(values);
    printf("%lld\n", total);
    return EXIT_SUCCESS;
}
