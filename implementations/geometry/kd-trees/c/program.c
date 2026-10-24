#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

/*
 * Every node stores the original index of its point. The median of the current
 * range becomes the node, and the two halves become its subtrees, so the tree
 * is balanced and each level alternates the splitting axis.
 */
typedef struct {
    long long x;
    long long y;
} point;

static point *pts;
static int *order;
static int *left_child;
static int *right_child;
static int current_axis;
static long long best_dist;
static int best_index;

static long long squared_distance(const point *a, const point *b) {
    long long dx = a->x - b->x;
    long long dy = a->y - b->y;
    return dx * dx + dy * dy;
}

static int compare_indices(const void *pa, const void *pb) {
    int a = *(const int *)pa;
    int b = *(const int *)pb;
    long long va = current_axis == 0 ? pts[a].x : pts[a].y;
    long long vb = current_axis == 0 ? pts[b].x : pts[b].y;
    if (va != vb) {
        return va < vb ? -1 : 1;
    }
    if (a != b) {
        return a < b ? -1 : 1;
    }
    return 0;
}

static int build(int lo, int hi, int depth) {
    if (lo >= hi) {
        return -1;
    }
    current_axis = depth & 1;
    qsort(order + lo, (size_t)(hi - lo), sizeof(int), compare_indices);
    int mid = lo + (hi - lo) / 2;
    int node = order[mid];
    left_child[node] = build(lo, mid, depth + 1);
    right_child[node] = build(mid + 1, hi, depth + 1);
    return node;
}

static void nearest(int node, const point *query, int depth) {
    if (node < 0) {
        return;
    }
    long long d = squared_distance(&pts[node], query);
    if (d < best_dist || (d == best_dist && node < best_index)) {
        best_dist = d;
        best_index = node;
    }

    int axis = depth & 1;
    long long delta = axis == 0 ? query->x - pts[node].x : query->y - pts[node].y;
    int near_child = delta <= 0 ? left_child[node] : right_child[node];
    int far_child = delta <= 0 ? right_child[node] : left_child[node];

    nearest(near_child, query, depth + 1);
    /* Equality is not pruned: a point at the same distance can have a lower index. */
    if (delta * delta <= best_dist) {
        nearest(far_child, query, depth + 1);
    }
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    pts = malloc((size_t)n * sizeof *pts);
    order = malloc((size_t)n * sizeof *order);
    left_child = malloc((size_t)n * sizeof *left_child);
    right_child = malloc((size_t)n * sizeof *right_child);
    if (pts == NULL || order == NULL || left_child == NULL || right_child == NULL) {
        free(pts);
        free(order);
        free(left_child);
        free(right_child);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld %lld", &pts[i].x, &pts[i].y) != 2) {
            free(pts);
            free(order);
            free(left_child);
            free(right_child);
            return 0;
        }
        order[i] = i;
    }

    int root = build(0, n, 0);

    int q;
    if (scanf("%d", &q) != 1) {
        free(pts);
        free(order);
        free(left_child);
        free(right_child);
        return 0;
    }

    for (int i = 0; i < q; i++) {
        point query;
        if (scanf("%lld %lld", &query.x, &query.y) != 2) {
            break;
        }
        best_dist = LLONG_MAX;
        best_index = -1;
        nearest(root, &query, 0);
        printf("%d\n", best_index + 1);
    }

    free(pts);
    free(order);
    free(left_child);
    free(right_child);
    return 0;
}
