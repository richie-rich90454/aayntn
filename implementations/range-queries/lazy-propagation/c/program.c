#include <stdio.h>
#include <stdlib.h>

/*
 * A lazy segment tree over a 1-indexed array of n positions, supporting range
 * addition and range sum queries.
 *
 * tree[i] holds the sum of the node's range, and lazy[i] holds the addition
 * that has already been applied to tree[i] but not yet to its children.
 */
typedef struct {
    int n;
    long long *tree;
    long long *lazy;
} lazy_tree;

/*
 * Ownership: lazy_tree_init allocates both arrays and lazy_tree_destroy frees
 * them. Every successful init must be matched by exactly one destroy, and the
 * tree must not be used after that destroy.
 */
static int lazy_tree_init(lazy_tree *t, int n) {
    t->n = n;
    t->tree = calloc((size_t)4 * n + 4, sizeof *t->tree);
    t->lazy = calloc((size_t)4 * n + 4, sizeof *t->lazy);
    if (t->tree == NULL || t->lazy == NULL) {
        free(t->tree);
        free(t->lazy);
        t->tree = NULL;
        t->lazy = NULL;
        t->n = 0;
        return 0;
    }
    return 1;
}

static void lazy_tree_destroy(lazy_tree *t) {
    free(t->tree);
    free(t->lazy);
    t->tree = NULL;
    t->lazy = NULL;
    t->n = 0;
}

/* Applies delta to every position in the node's range [lo, hi]. */
static void lazy_tree_apply(lazy_tree *t, int node, int lo, int hi, long long delta) {
    t->tree[node] += delta * (long long)(hi - lo + 1);
    t->lazy[node] += delta;
}

/* Pushes the node's pending addition to its two children. */
static void lazy_tree_push(lazy_tree *t, int node, int lo, int hi) {
    if (t->lazy[node] == 0 || lo == hi) {
        return;
    }
    int mid = lo + (hi - lo) / 2;
    lazy_tree_apply(t, node * 2, lo, mid, t->lazy[node]);
    lazy_tree_apply(t, node * 2 + 1, mid + 1, hi, t->lazy[node]);
    t->lazy[node] = 0;
}

static void lazy_tree_add(lazy_tree *t, int node, int lo, int hi, int left, int right,
                          long long delta) {
    if (right < lo || hi < left) {
        return;
    }
    if (left <= lo && hi <= right) {
        lazy_tree_apply(t, node, lo, hi, delta);
        return;
    }
    lazy_tree_push(t, node, lo, hi);
    int mid = lo + (hi - lo) / 2;
    lazy_tree_add(t, node * 2, lo, mid, left, right, delta);
    lazy_tree_add(t, node * 2 + 1, mid + 1, hi, left, right, delta);
    t->tree[node] = t->tree[node * 2] + t->tree[node * 2 + 1];
}

static long long lazy_tree_sum(lazy_tree *t, int node, int lo, int hi, int left, int right) {
    if (right < lo || hi < left) {
        return 0;
    }
    if (left <= lo && hi <= right) {
        return t->tree[node];
    }
    lazy_tree_push(t, node, lo, hi);
    int mid = lo + (hi - lo) / 2;
    return lazy_tree_sum(t, node * 2, lo, mid, left, right) +
           lazy_tree_sum(t, node * 2 + 1, mid + 1, hi, left, right);
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

    lazy_tree t;
    if (!lazy_tree_init(&t, n)) {
        return 0;
    }

    for (int k = 0; k < q; k++) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int left = 0;
            int right = 0;
            long long delta = 0;
            if (scanf("%d %d %lld", &left, &right, &delta) != 3) {
                break;
            }
            lazy_tree_add(&t, 1, 1, n, left, right, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            printf("%lld\n", lazy_tree_sum(&t, 1, 1, n, left, right));
        } else {
            break;
        }
    }

    lazy_tree_destroy(&t);
    return 0;
}
