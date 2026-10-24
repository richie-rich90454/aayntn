#include <stdio.h>
#include <stdlib.h>

/*
 * Persistent segment tree over the compressed values of a static array.
 *
 * Version i is the frequency tree of a[0..i), built from version i - 1 by
 * copying only the root-to-leaf path of the inserted value. The difference
 * between version r and version l - 1 is the frequency tree of a[l-1..r), so
 * one descent that subtracts the two left counts returns the k-th smallest.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

static int *left_child;
static int *right_child;
static int *counts;
static int node_count;

/* The first index in values[0..length) whose value is at least key. */
static int lower_bound(const long long *values, int length, long long key) {
    int low = 0;
    int high = length;
    while (low < high) {
        int middle = low + (high - low) / 2;
        if (values[middle] < key) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

/*
 * Copy the path to position and increment every count on it. Node 0 is the
 * empty node, so previous == 0 needs no special case.
 */
static int update(int previous, int low, int high, int position) {
    int node = ++node_count;
    left_child[node] = left_child[previous];
    right_child[node] = right_child[previous];
    counts[node] = counts[previous] + 1;
    if (low < high) {
        int middle = low + (high - low) / 2;
        if (position <= middle) {
            left_child[node] = update(left_child[previous], low, middle, position);
        } else {
            right_child[node] = update(right_child[previous], middle + 1, high, position);
        }
    }
    return node;
}

/* The k-th smallest rank in the multiset stored by after minus before. */
static int kth(int before, int after, int low, int high, int k) {
    while (low < high) {
        int middle = low + (high - low) / 2;
        int in_left = counts[left_child[after]] - counts[left_child[before]];
        if (k <= in_left) {
            before = left_child[before];
            after = left_child[after];
            high = middle;
        } else {
            k -= in_left;
            before = right_child[before];
            after = right_child[after];
            low = middle + 1;
        }
    }
    return low;
}

static int compare_values(const void *first, const void *second) {
    long long left = *(const long long *)first;
    long long right = *(const long long *)second;
    return (left > right) - (left < right);
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    long long *values = malloc((size_t)n * sizeof *values);
    long long *sorted = malloc((size_t)n * sizeof *sorted);
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

    qsort(sorted, (size_t)n, sizeof *sorted, compare_values);
    int m = 1;
    for (int i = 1; i < n; i++) {
        if (sorted[i] != sorted[m - 1]) {
            sorted[m] = sorted[i];
            m++;
        }
    }

    int depth = 0;
    while ((1LL << depth) < m) {
        depth++;
    }
    size_t capacity = (size_t)(n + 1) * (size_t)(depth + 2) + 1;
    left_child = calloc(capacity, sizeof *left_child);
    right_child = calloc(capacity, sizeof *right_child);
    counts = calloc(capacity, sizeof *counts);
    int *roots = calloc((size_t)(n + 1), sizeof *roots);
    if (left_child == NULL || right_child == NULL || counts == NULL || roots == NULL) {
        free(left_child);
        free(right_child);
        free(counts);
        free(roots);
        free(values);
        free(sorted);
        return 0;
    }

    for (int i = 1; i <= n; i++) {
        int position = lower_bound(sorted, m, values[i - 1]) + 1;
        roots[i] = update(roots[i - 1], 1, m, position);
    }

    for (int query = 0; query < q; query++) {
        int left = 0;
        int right = 0;
        int k = 0;
        if (scanf("%d %d %d", &left, &right, &k) != 3) {
            break;
        }
        int answer = kth(roots[left - 1], roots[right], 1, m, k);
        printf("%lld\n", sorted[answer - 1]);
    }

    free(left_child);
    free(right_child);
    free(counts);
    free(roots);
    free(values);
    free(sorted);
    return 0;
}
