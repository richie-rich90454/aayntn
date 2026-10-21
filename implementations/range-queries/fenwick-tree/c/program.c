#include <stdio.h>
#include <stdlib.h>

/*
 * A Fenwick tree (binary indexed tree) over a 1-indexed array: tree[i] holds
 * the sum of the positions in the block (i - lowbit(i), i], where lowbit(i) is
 * the largest power of two that divides i.
 */
typedef struct {
    int n;
    long long *tree;
} fenwick;

/*
 * Ownership: fenwick_init allocates the storage and fenwick_destroy frees it.
 * Every successful init must be matched by exactly one destroy, and the tree
 * must not be used after that destroy.
 */
static int fenwick_init(fenwick *f, int n) {
    f->n = n;
    f->tree = calloc((size_t)n + 1, sizeof *f->tree);
    return f->tree != NULL;
}

static void fenwick_destroy(fenwick *f) {
    free(f->tree);
    f->tree = NULL;
    f->n = 0;
}

/* Adds delta to the value at the 1-based index. */
static void fenwick_add(fenwick *f, int index, long long delta) {
    if (index < 1) {
        return;
    }
    /* Stepping up by lowbit visits exactly the blocks that contain the index. */
    for (int i = index; i <= f->n; i += i & (-i)) {
        f->tree[i] += delta;
    }
}

/* The sum of the positions 1..index. */
static long long fenwick_prefix_sum(const fenwick *f, int index) {
    if (index > f->n) {
        index = f->n;
    }
    long long total = 0;
    /* Stepping down by lowbit visits disjoint blocks that partition 1..index. */
    for (int i = index; i > 0; i -= i & (-i)) {
        total += f->tree[i];
    }
    return total;
}

/* The sum of the positions left..right, both inclusive. */
static long long fenwick_range_sum(const fenwick *f, int left, int right) {
    return fenwick_prefix_sum(f, right) - fenwick_prefix_sum(f, left - 1);
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    fenwick f;
    if (!fenwick_init(&f, n)) {
        return 0;
    }

    for (int k = 0; k < q; k++) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int index = 0;
            long long delta = 0;
            if (scanf("%d %lld", &index, &delta) != 2) {
                break;
            }
            fenwick_add(&f, index, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            printf("%lld\n", fenwick_range_sum(&f, left, right));
        } else {
            break;
        }
    }

    fenwick_destroy(&f);
    return 0;
}
