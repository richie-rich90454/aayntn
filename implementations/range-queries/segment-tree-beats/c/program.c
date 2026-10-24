#include <stdio.h>
#include <stdlib.h>

/*
 * Segment tree beats over a 1-indexed array of n positions, supporting range
 * chmin and range sum queries.
 *
 * Every node stores its sum, its largest value, the second largest distinct
 * value, and how many positions hold the largest value. A chmin that lands
 * strictly between the two largest values changes only the largest group, so
 * the node can absorb it in constant time; anything deeper has to descend.
 */

typedef long long i64;

static int n;
static i64 *values;
static i64 *sum_tree;
static i64 *max1_tree;
static i64 *max2_tree;
static int *count_tree;

static i64 max64(i64 a, i64 b) {
    return a > b ? a : b;
}

static void pull(int node) {
    const int left = node * 2;
    const int right = left + 1;
    sum_tree[node] = sum_tree[left] + sum_tree[right];
    if (max1_tree[left] == max1_tree[right]) {
        max1_tree[node] = max1_tree[left];
        count_tree[node] = count_tree[left] + count_tree[right];
        max2_tree[node] = max64(max2_tree[left], max2_tree[right]);
    } else if (max1_tree[left] > max1_tree[right]) {
        max1_tree[node] = max1_tree[left];
        count_tree[node] = count_tree[left];
        max2_tree[node] = max64(max2_tree[left], max1_tree[right]);
    } else {
        max1_tree[node] = max1_tree[right];
        count_tree[node] = count_tree[right];
        max2_tree[node] = max64(max1_tree[left], max2_tree[right]);
    }
}

/*
 * Caps the node's maximum at x. The caller guarantees max2 < x < max1, so
 * exactly the positions holding the maximum change.
 */
static void apply_cap(int node, i64 x) {
    if (max1_tree[node] <= x) {
        return;
    }
    sum_tree[node] -= (max1_tree[node] - x) * (i64)count_tree[node];
    max1_tree[node] = x;
}

/*
 * Passes a cap that is already included in the node's aggregates down to its
 * two children. The child's second maximum is at most the parent's second
 * maximum, which the stored cap exceeded, so the child absorbs it in constant
 * time.
 */
static void push(int node) {
    apply_cap(node * 2, max1_tree[node]);
    apply_cap(node * 2 + 1, max1_tree[node]);
}

static void build(int node, int lo, int hi) {
    if (lo == hi) {
        sum_tree[node] = values[lo];
        max1_tree[node] = values[lo];
        max2_tree[node] = -1;
        count_tree[node] = 1;
        return;
    }
    const int mid = lo + (hi - lo) / 2;
    build(node * 2, lo, mid);
    build(node * 2 + 1, mid + 1, hi);
    pull(node);
}

static void chmin_range(int node, int lo, int hi, int left, int right, i64 x) {
    if (right < lo || hi < left || max1_tree[node] <= x) {
        return;
    }
    if (left <= lo && hi <= right && max2_tree[node] < x) {
        apply_cap(node, x);
        return;
    }
    if (lo == hi) {
        apply_cap(node, x);
        return;
    }
    push(node);
    const int mid = lo + (hi - lo) / 2;
    chmin_range(node * 2, lo, mid, left, right, x);
    chmin_range(node * 2 + 1, mid + 1, hi, left, right, x);
    pull(node);
}

static i64 range_sum(int node, int lo, int hi, int left, int right) {
    if (right < lo || hi < left) {
        return 0;
    }
    if (left <= lo && hi <= right) {
        return sum_tree[node];
    }
    push(node);
    const int mid = lo + (hi - lo) / 2;
    return range_sum(node * 2, lo, mid, left, right) +
           range_sum(node * 2 + 1, mid + 1, hi, left, right);
}

int main(void) {
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 1;
    }
    if (n <= 0) {
        return 0;
    }

    const size_t size = (size_t)(4 * n + 4);
    values = malloc(sizeof(i64) * (size_t)(n + 1));
    sum_tree = malloc(sizeof(i64) * size);
    max1_tree = malloc(sizeof(i64) * size);
    max2_tree = malloc(sizeof(i64) * size);
    count_tree = malloc(sizeof(int) * size);
    if (values == NULL || sum_tree == NULL || max1_tree == NULL || max2_tree == NULL ||
        count_tree == NULL) {
        free(values);
        free(sum_tree);
        free(max1_tree);
        free(max2_tree);
        free(count_tree);
        return 1;
    }

    for (int i = 1; i <= n; ++i) {
        if (scanf("%lld", &values[i]) != 1) {
            free(values);
            free(sum_tree);
            free(max1_tree);
            free(max2_tree);
            free(count_tree);
            return 1;
        }
    }

    build(1, 1, n);

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int left = 0;
            int right = 0;
            i64 x = 0;
            if (scanf("%d %d %lld", &left, &right, &x) != 3) {
                break;
            }
            chmin_range(1, 1, n, left, right, x);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            printf("%lld\n", range_sum(1, 1, n, left, right));
        } else {
            break;
        }
    }

    free(values);
    free(sum_tree);
    free(max1_tree);
    free(max2_tree);
    free(count_tree);
    return 0;
}
