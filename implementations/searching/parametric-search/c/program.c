#include <stdio.h>
#include <stdlib.h>

/*
 * Parametric search driver.
 *
 * Reads n, n nonnegative values and a budget, then prints the largest level x
 * whose capped sum, the sum of min(a[i], x), is at most the budget.
 */

static int feasible(const long long *a, int n, long long x, long long budget)
{
    long long total = 0;

    for (int i = 0; i < n; ++i) {
        total += a[i] < x ? a[i] : x;
        if (total > budget) {
            return 0;
        }
    }
    return 1;
}

int main(void)
{
    int n;

    if (scanf("%d", &n) != 1 || n <= 0) {
        printf("0\n");
        return 0;
    }

    long long *a = malloc(sizeof *a * (size_t)n);

    if (a == NULL) {
        return EXIT_FAILURE;
    }

    long long max_value = 0;

    for (int i = 0; i < n; ++i) {
        if (scanf("%lld", &a[i]) != 1) {
            a[i] = 0;
        }
        if (a[i] > max_value) {
            max_value = a[i];
        }
    }

    long long budget = 0;

    if (scanf("%lld", &budget) != 1) {
        budget = 0;
    }

    long long lo = 0;
    long long hi = max_value;
    long long answer = 0;

    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;

        if (feasible(a, n, mid, budget)) {
            answer = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    free(a);
    printf("%lld\n", answer);
    return 0;
}
