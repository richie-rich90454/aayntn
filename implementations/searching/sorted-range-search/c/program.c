#include <stdio.h>
#include <stdlib.h>

/*
 * Sorted range search driver.
 *
 * Reads n, then n disjoint intervals sorted by left endpoint, then one point.
 * Prints the 0-based index of the interval that contains the point, or -1 when
 * no interval contains it.
 */

int main(void)
{
    int n;

    if (scanf("%d", &n) != 1 || n < 0) {
        printf("-1\n");
        return EXIT_SUCCESS;
    }

    long long *left = NULL;
    long long *right = NULL;

    if (n > 0) {
        left = malloc(sizeof *left * (size_t)n);
        right = malloc(sizeof *right * (size_t)n);
        if (left == NULL || right == NULL) {
            free(left);
            free(right);
            return EXIT_FAILURE;
        }
    }

    for (int i = 0; i < n; ++i) {
        if (scanf("%lld %lld", &left[i], &right[i]) != 2) {
            free(left);
            free(right);
            printf("-1\n");
            return EXIT_SUCCESS;
        }
    }

    long long point;

    if (scanf("%lld", &point) != 1) {
        free(left);
        free(right);
        printf("-1\n");
        return EXIT_SUCCESS;
    }

    int lo = 0;
    int hi = n - 1;
    int answer = -1;

    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;

        if (point < left[mid]) {
            hi = mid - 1;
        } else if (point > right[mid]) {
            lo = mid + 1;
        } else {
            answer = mid;
            break;
        }
    }

    free(left);
    free(right);
    printf("%d\n", answer);
    return EXIT_SUCCESS;
}
