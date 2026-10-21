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
int fenwick_init(fenwick *f, int n) {
    f->n = n;
    f->tree = calloc((size_t)n + 1, sizeof *f->tree);
    return f->tree != NULL;
}

void fenwick_destroy(fenwick *f) {
    free(f->tree);
    f->tree = NULL;
    f->n = 0;
}

/* Adds delta to the value at the 1-based index. */
void fenwick_add(fenwick *f, int index, long long delta) {
    if (index < 1) {
        return;
    }
    /* Stepping up by lowbit visits exactly the blocks that contain the index. */
    for (int i = index; i <= f->n; i += i & (-i)) {
        f->tree[i] += delta;
    }
}

/* The sum of the positions 1..index. */
long long fenwick_prefix_sum(const fenwick *f, int index) {
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
long long fenwick_range_sum(const fenwick *f, int left, int right) {
    return fenwick_prefix_sum(f, right) - fenwick_prefix_sum(f, left - 1);
}

/*
 * Self-check only: the routines above are the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    fenwick f;
    if (!fenwick_init(&f, 5)) {
        return EXIT_FAILURE;
    }

    fenwick_add(&f, 1, 5);
    fenwick_add(&f, 2, 3);
    if (fenwick_prefix_sum(&f, 2) != 8) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }
    if (fenwick_range_sum(&f, 1, 2) != 8) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }
    if (fenwick_range_sum(&f, 1, 5) != 8) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }
    if (fenwick_range_sum(&f, 3, 5) != 0) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }

    /* A negative delta removes value, and the empty prefix sums to zero. */
    fenwick_add(&f, 2, -3);
    if (fenwick_range_sum(&f, 1, 5) != 5) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }
    if (fenwick_prefix_sum(&f, 0) != 0) {
        fenwick_destroy(&f);
        return EXIT_FAILURE;
    }

    fenwick_destroy(&f);
    return EXIT_SUCCESS;
}
