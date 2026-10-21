#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A segment tree over a 1-indexed array of n values: tree[node] holds the sum
 * of the values of the range that the node covers, so every node caches the
 * result of merging its two children.
 */
typedef struct {
    int n;
    long long *tree;
} segment_tree;

/* Fills the subtree of node, which covers the positions lo..hi. */
static void segment_tree_build(segment_tree *st, int node, int lo, int hi,
                               const long long *values) {
    if (lo == hi) {
        st->tree[node] = values[lo - 1];
        return;
    }
    const int mid = lo + (hi - lo) / 2;
    segment_tree_build(st, node * 2, lo, mid, values);
    segment_tree_build(st, node * 2 + 1, mid + 1, hi, values);
    st->tree[node] = st->tree[node * 2] + st->tree[node * 2 + 1];
}

/* Assigns the value at the 1-based index inside the subtree of node. */
static void segment_tree_assign(segment_tree *st, int node, int lo, int hi,
                                int index, long long value) {
    if (lo == hi) {
        st->tree[node] = value;
        return;
    }
    const int mid = lo + (hi - lo) / 2;
    if (index <= mid) {
        segment_tree_assign(st, node * 2, lo, mid, index, value);
    } else {
        segment_tree_assign(st, node * 2 + 1, mid + 1, hi, index, value);
    }
    /* Merging the two children restores the invariant of the node. */
    st->tree[node] = st->tree[node * 2] + st->tree[node * 2 + 1];
}

/* The sum of the positions left..right inside the subtree of node. */
static long long segment_tree_query(const segment_tree *st, int node, int lo,
                                    int hi, int left, int right) {
    if (right < lo || hi < left) {
        /* The queried range and the subtree do not overlap. */
        return 0;
    }
    if (left <= lo && hi <= right) {
        return st->tree[node];
    }
    const int mid = lo + (hi - lo) / 2;
    return segment_tree_query(st, node * 2, lo, mid, left, right) +
           segment_tree_query(st, node * 2 + 1, mid + 1, hi, left, right);
}

/*
 * Ownership: segment_tree_init allocates the storage and segment_tree_destroy
 * frees it. Every successful init must be matched by exactly one destroy, and
 * the tree must not be used after that destroy. The values array belongs to
 * the caller and is only read while the tree is built.
 *
 * values holds the n values of the positions 1..n, so values[0] is the value
 * of the position 1.
 */
static int segment_tree_init(segment_tree *st, const long long *values, int n) {
    if (n < 0) {
        return 0;
    }
    st->n = n;
    /* A binary tree over n leaves fits in 4n nodes when the root is the 1. */
    st->tree = calloc((size_t)(4 * n + 4), sizeof *st->tree);
    if (st->tree == NULL) {
        st->n = 0;
        return 0;
    }
    if (n > 0) {
        segment_tree_build(st, 1, 1, n, values);
    }
    return 1;
}

static void segment_tree_destroy(segment_tree *st) {
    free(st->tree);
    st->tree = NULL;
    st->n = 0;
}

/* Assigns the value at the 1-based index; an index outside 1..n is ignored. */
static void segment_tree_set(segment_tree *st, int index, long long value) {
    if (index < 1 || index > st->n) {
        return;
    }
    segment_tree_assign(st, 1, 1, st->n, index, value);
}

/* The sum of the positions left..right, both inclusive. */
static long long segment_tree_range_sum(const segment_tree *st, int left, int right) {
    if (left < 1) {
        left = 1;
    }
    if (right > st->n) {
        right = st->n;
    }
    if (left > right) {
        return 0;
    }
    return segment_tree_query(st, 1, 1, st->n, left, right);
}

int main(void) {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (q < 0) {
        q = 0;
    }

    /* Every position starts at zero, because the input carries no values. */
    long long *values = calloc((size_t)(n > 0 ? n : 1), sizeof *values);
    if (values == NULL) {
        return 0;
    }

    segment_tree st;
    if (!segment_tree_init(&st, values, n)) {
        free(values);
        return 0;
    }
    free(values);

    for (int k = 0; k < q; k++) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int index = 0;
            long long value = 0;
            if (scanf("%d %lld", &index, &value) != 2) {
                break;
            }
            segment_tree_set(&st, index, value);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            printf("%lld\n", segment_tree_range_sum(&st, left, right));
        } else {
            break;
        }
    }

    segment_tree_destroy(&st);
    return 0;
}
