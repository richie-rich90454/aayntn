#include <stdio.h>
#include <stdlib.h>

/*
 * The cost of a group is the square of its sum, and the groups are contiguous,
 * so dp[g][i] = min over j < i of dp[g - 1][j] + (prefix[i] - prefix[j])^2.
 *
 * The best j never moves left as i grows. That monotonicity lets the program
 * find the middle entry of a range, then restrict the candidates of the left
 * half to the entries at or below that j and the right half to the entries at
 * or above it.
 */
#define INF 4000000000000000000LL

static long long *prefix_sum;
static long long *previous_row;
static long long *current_row;

static void solve_layer(int left, int right, int opt_left, int opt_right) {
    if (left > right) {
        return;
    }

    const int mid = left + (right - left) / 2;
    const int upper = opt_right < mid - 1 ? opt_right : mid - 1;
    long long best = INF;
    int best_j = opt_left;

    for (int j = opt_left; j <= upper; j++) {
        const long long difference = prefix_sum[mid] - prefix_sum[j];
        const long long candidate = previous_row[j] + difference * difference;
        if (candidate < best) {
            best = candidate;
            best_j = j;
        }
    }

    current_row[mid] = best;
    /*
     * best_j is the smallest optimal split point of mid, so every entry to the
     * left uses a split point at most best_j and every entry to the right uses
     * one at least best_j.
     */
    solve_layer(left, mid - 1, opt_left, best_j);
    solve_layer(mid + 1, right, best_j, opt_right);
}

int main(void) {
    int n = 0;
    int k = 0;
    if (scanf("%d %d", &n, &k) != 2) {
        return 0;
    }

    if (n <= 0) {
        printf("0\n");
        return 0;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    prefix_sum = malloc((size_t)(n + 1) * sizeof *prefix_sum);
    previous_row = malloc((size_t)(n + 1) * sizeof *previous_row);
    current_row = malloc((size_t)(n + 1) * sizeof *current_row);
    if (prefix_sum == NULL || previous_row == NULL || current_row == NULL) {
        free(prefix_sum);
        free(previous_row);
        free(current_row);
        return 0;
    }

    prefix_sum[0] = 0;
    for (int i = 1; i <= n; i++) {
        long long value = 0;
        if (scanf("%lld", &value) != 1) {
            value = 0;
        }
        prefix_sum[i] = prefix_sum[i - 1] + value;
    }

    for (int i = 0; i <= n; i++) {
        previous_row[i] = INF;
        current_row[i] = INF;
    }
    previous_row[0] = 0;

    for (int g = 1; g <= k; g++) {
        for (int i = 0; i <= n; i++) {
            current_row[i] = INF;
        }
        /*
         * Layer g only needs prefixes that leave at least k - g elements for
         * the remaining groups, and every later layer reads only that range.
         */
        const int last = n - k + g;
        solve_layer(g, last, g - 1, last - 1);

        long long *swap = previous_row;
        previous_row = current_row;
        current_row = swap;
    }

    printf("%lld\n", previous_row[n]);
    free(prefix_sum);
    free(previous_row);
    free(current_row);
    return 0;
}
