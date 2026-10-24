#include <stdio.h>
#include <stdlib.h>

/**
 * Minimum total cost of reaching position n, where entering position i costs
 * a[i] and a single hop covers at most k positions.
 *
 * Input: n k, then n integers a[1..n].
 * Output: dp[n], on one line.
 */
int main(void) {
    int n = 0;
    int k = 1;
    if (scanf("%d %d", &n, &k) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (k < 1) {
        k = 1;
    }
    if (n == 0) {
        printf("0\n");
        return 0;
    }

    long long *dp = malloc(((size_t)n + 1) * sizeof *dp);
    int *deque = malloc(((size_t)n + 1) * sizeof *deque);
    if (dp == NULL || deque == NULL) {
        free(dp);
        free(deque);
        return 0;
    }

    /* The deque holds indices with strictly increasing dp values. Its front is
       the cheapest candidate inside the current window. */
    dp[0] = 0;
    int head = 0;
    int tail = 0;
    deque[tail++] = 0;

    int kept = 0;
    for (int i = 1; i <= n; i++) {
        long long value = 0;
        if (scanf("%lld", &value) != 1) {
            break;
        }

        /* The window is [i - k, i - 1], so an index is stale only when it is
           strictly smaller than i - k. */
        while (head < tail && deque[head] < i - k) {
            head++;
        }

        dp[i] = value + dp[deque[head]];

        /* An older index with a value no smaller than dp[i] can never be the
           minimum again: i expires later and is at least as cheap. */
        while (head < tail && dp[deque[tail - 1]] >= dp[i]) {
            tail--;
        }
        deque[tail++] = i;
        kept = i;
    }

    printf("%lld\n", dp[kept]);

    free(deque);
    free(dp);
    return 0;
}
