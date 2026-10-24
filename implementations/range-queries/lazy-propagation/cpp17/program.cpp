#include <cstdio>
#include <vector>

/*
 * A lazy segment tree over a 1-indexed array of n positions, supporting range
 * addition and range sum queries.
 *
 * tree[i] holds the sum of the node's range, and lazy[i] holds the addition
 * that has already been applied to tree[i] but not yet to its children.
 */
class LazySum {
public:
    explicit LazySum(int n) : n_(n), tree_(4 * n + 4, 0), lazy_(4 * n + 4, 0) {}

    void range_add(int left, int right, long long delta) {
        range_add(1, 1, n_, left, right, delta);
    }

    long long range_sum(int left, int right) {
        return range_sum(1, 1, n_, left, right);
    }

private:
    void apply(int node, int lo, int hi, long long delta) {
        tree_[node] += delta * static_cast<long long>(hi - lo + 1);
        lazy_[node] += delta;
    }

    void push(int node, int lo, int hi) {
        if (lazy_[node] == 0 || lo == hi) {
            return;
        }
        const int mid = lo + (hi - lo) / 2;
        apply(node * 2, lo, mid, lazy_[node]);
        apply(node * 2 + 1, mid + 1, hi, lazy_[node]);
        lazy_[node] = 0;
    }

    void range_add(int node, int lo, int hi, int left, int right, long long delta) {
        if (right < lo || hi < left) {
            return;
        }
        if (left <= lo && hi <= right) {
            apply(node, lo, hi, delta);
            return;
        }
        push(node, lo, hi);
        const int mid = lo + (hi - lo) / 2;
        range_add(node * 2, lo, mid, left, right, delta);
        range_add(node * 2 + 1, mid + 1, hi, left, right, delta);
        tree_[node] = tree_[node * 2] + tree_[node * 2 + 1];
    }

    long long range_sum(int node, int lo, int hi, int left, int right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return tree_[node];
        }
        push(node, lo, hi);
        const int mid = lo + (hi - lo) / 2;
        return range_sum(node * 2, lo, mid, left, right) +
               range_sum(node * 2 + 1, mid + 1, hi, left, right);
    }

    int n_;
    std::vector<long long> tree_;
    std::vector<long long> lazy_;
};

int main() {
    int n = 0;
    int q = 0;
    if (std::scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    LazySum tree(n);

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (std::scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int left = 0;
            int right = 0;
            long long delta = 0;
            if (std::scanf("%d %d %lld", &left, &right, &delta) != 3) {
                break;
            }
            tree.range_add(left, right, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (std::scanf("%d %d", &left, &right) != 2) {
                break;
            }
            std::printf("%lld\n", tree.range_sum(left, right));
        } else {
            break;
        }
    }

    return 0;
}
