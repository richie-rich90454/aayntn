#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

/*
 * Every node stores the original index of its point. The median of the current
 * range becomes the node, and the two halves become its subtrees, so the tree
 * is balanced and each level alternates the splitting axis.
 */
struct Point {
    long long x;
    long long y;
};

static std::vector<Point> pts;
static std::vector<int> order;
static std::vector<int> left_child;
static std::vector<int> right_child;
static long long best_dist;
static int best_index;

long long squared_distance(const Point& a, const Point& b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

int build(int lo, int hi, int depth) {
    if (lo >= hi) {
        return -1;
    }
    int axis = depth & 1;
    std::sort(order.begin() + lo, order.begin() + hi, [axis](int a, int b) {
        long long va = axis == 0 ? pts[a].x : pts[a].y;
        long long vb = axis == 0 ? pts[b].x : pts[b].y;
        if (va != vb) {
            return va < vb;
        }
        return a < b;
    });
    int mid = lo + (hi - lo) / 2;
    int node = order[mid];
    left_child[node] = build(lo, mid, depth + 1);
    right_child[node] = build(mid + 1, hi, depth + 1);
    return node;
}

void nearest(int node, const Point& query, int depth) {
    if (node < 0) {
        return;
    }
    long long d = squared_distance(pts[node], query);
    if (d < best_dist || (d == best_dist && node < best_index)) {
        best_dist = d;
        best_index = node;
    }

    int axis = depth & 1;
    long long delta = axis == 0 ? query.x - pts[node].x : query.y - pts[node].y;
    int near_child = delta <= 0 ? left_child[node] : right_child[node];
    int far_child = delta <= 0 ? right_child[node] : left_child[node];

    nearest(near_child, query, depth + 1);
    // Equality is not pruned: a point at the same distance can have a lower index.
    if (delta * delta <= best_dist) {
        nearest(far_child, query, depth + 1);
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    if (!(std::cin >> n) || n <= 0) {
        return 0;
    }

    pts.resize(n);
    order.resize(n);
    left_child.resize(n);
    right_child.resize(n);
    for (int i = 0; i < n; i++) {
        std::cin >> pts[i].x >> pts[i].y;
        order[i] = i;
    }

    int root = build(0, n, 0);

    int q;
    if (!(std::cin >> q)) {
        return 0;
    }
    for (int i = 0; i < q; i++) {
        Point query;
        std::cin >> query.x >> query.y;
        best_dist = std::numeric_limits<long long>::max();
        best_index = -1;
        nearest(root, query, 0);
        std::cout << best_index + 1 << '\n';
    }
    return 0;
}
