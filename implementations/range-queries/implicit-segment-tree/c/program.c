#include <stdio.h>
#include <stdlib.h>

/*
 * An implicit segment tree over the fixed domain [1, m]. A node is allocated
 * only when an update first enters its range, so an untouched range costs no
 * memory and stands for a range whose values are still zero.
 */
typedef struct {
    int left;
    int right;
    long long sum;
} node;

static node *pool;
static int used;

/* Node 0 is the null node: it has no interval and its sum is always zero. */
static int new_node(void) {
    int index = used++;
    pool[index].left = 0;
    pool[index].right = 0;
    pool[index].sum = 0;
    return index;
}

static void add(int root, int lo, int hi, int pos, long long delta) {
    pool[root].sum += delta;
    if (lo == hi) {
        return;
    }
    int mid = lo + (hi - lo) / 2;
    if (pos <= mid) {
        if (pool[root].left == 0) {
            pool[root].left = new_node();
        }
        add(pool[root].left, lo, mid, pos, delta);
    } else {
        if (pool[root].right == 0) {
            pool[root].right = new_node();
        }
        add(pool[root].right, mid + 1, hi, pos, delta);
    }
}

static long long query(int root, int lo, int hi, int ql, int qr) {
    if (root == 0 || qr < lo || hi < ql) {
        return 0;
    }
    if (ql <= lo && hi <= qr) {
        return pool[root].sum;
    }
    int mid = lo + (hi - lo) / 2;
    long long total = 0;
    if (ql <= mid) {
        total += query(pool[root].left, lo, mid, ql, qr);
    }
    if (qr > mid) {
        total += query(pool[root].right, mid + 1, hi, ql, qr);
    }
    return total;
}

int main(void) {
    int m = 0;
    int q = 0;
    if (scanf("%d %d", &m, &q) != 2 || m < 1 || q < 0) {
        return 0;
    }

    int bits = 0;
    long long size = 1;
    while (size < m) {
        size <<= 1;
        ++bits;
    }
    /* A root-to-leaf path has bits + 1 nodes; every update creates at most
       one node per level, and the root exists before any operation. */
    long long capacity = 2 + (long long)q * (bits + 1);
    pool = calloc((size_t)capacity, sizeof *pool);
    if (pool == NULL) {
        return 0;
    }
    used = 1;
    new_node();

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int pos = 0;
            long long delta = 0;
            if (scanf("%d %lld", &pos, &delta) != 2) {
                break;
            }
            add(1, 1, m, pos, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (scanf("%d %d", &left, &right) != 2) {
                break;
            }
            printf("%lld\n", query(1, 1, m, left, right));
        } else {
            break;
        }
    }

    free(pool);
    return 0;
}
