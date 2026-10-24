#include <cstdio>
#include <limits>
#include <vector>

/*
 * Segment tree beats over a 1-indexed array of n positions, supporting range
 * chmin and range sum queries.
 *
 * Every node stores its sum, its largest value, the second largest distinct
 * value, and how many positions hold the largest value. A chmin that lands
 * strictly between the two largest values changes only the largest group, so
 * the node can absorb it in constant time; anything deeper has to descend.
 */
class SegmentTreeBeats {
public:
    SegmentTreeBeats(int n, const std::vector<long long>& values)
        : n_(n),
          sum_(4 * n + 4, 0),
          max1_(4 * n + 4, 0),
          max2_(4 * n + 4, kNone),
          count_(4 * n + 4, 0) {
        if (n_ > 0) {
            build(1, 1, n_, values);
        }
    }

    void chmin(int left, int right, long long x) {
        if (n_ > 0) {
            chmin(1, 1, n_, left, right, x);
        }
    }

    long long range_sum(int left, int right) {
        if (n_ == 0) {
            return 0;
        }
        return range_sum(1, 1, n_, left, right);
    }

private:
    static constexpr long long kNone = std::numeric_limits<long long>::min();

    static long long max64(long long a, long long b) {
        return a > b ? a : b;
    }

    void pull(int node) {
        const int left = node * 2;
        const int right = left + 1;
        sum_[node] = sum_[left] + sum_[right];
        if (max1_[left] == max1_[right]) {
            max1_[node] = max1_[left];
            count_[node] = count_[left] + count_[right];
            max2_[node] = max64(max2_[left], max2_[right]);
        } else if (max1_[left] > max1_[right]) {
            max1_[node] = max1_[left];
            count_[node] = count_[left];
            max2_[node] = max64(max2_[left], max1_[right]);
        } else {
            max1_[node] = max1_[right];
            count_[node] = count_[right];
            max2_[node] = max64(max1_[left], max2_[right]);
        }
    }

    /*
     * Caps the node's maximum at x. The caller guarantees max2 < x < max1, so
     * exactly the positions holding the maximum change.
     */
    void apply_cap(int node, long long x) {
        if (max1_[node] <= x) {
            return;
        }
        sum_[node] -= (max1_[node] - x) * count_[node];
        max1_[node] = x;
    }

    /*
     * Passes a cap that is already included in the node's aggregates down to
     * its two children. The child's second maximum is at most the parent's
     * second maximum, which the stored cap exceeded, so the child absorbs it
     * in constant time.
     */
    void push(int node) {
        apply_cap(node * 2, max1_[node]);
        apply_cap(node * 2 + 1, max1_[node]);
    }

    void build(int node, int lo, int hi, const std::vector<long long>& values) {
        if (lo == hi) {
            sum_[node] = values[lo];
            max1_[node] = values[lo];
            max2_[node] = kNone;
            count_[node] = 1;
            return;
        }
        const int mid = lo + (hi - lo) / 2;
        build(node * 2, lo, mid, values);
        build(node * 2 + 1, mid + 1, hi, values);
        pull(node);
    }

    void chmin(int node, int lo, int hi, int left, int right, long long x) {
        if (right < lo || hi < left || max1_[node] <= x) {
            return;
        }
        if (left <= lo && hi <= right && max2_[node] < x) {
            apply_cap(node, x);
            return;
        }
        if (lo == hi) {
            apply_cap(node, x);
            return;
        }
        push(node);
        const int mid = lo + (hi - lo) / 2;
        chmin(node * 2, lo, mid, left, right, x);
        chmin(node * 2 + 1, mid + 1, hi, left, right, x);
        pull(node);
    }

    long long range_sum(int node, int lo, int hi, int left, int right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return sum_[node];
        }
        push(node);
        const int mid = lo + (hi - lo) / 2;
        return range_sum(node * 2, lo, mid, left, right) +
               range_sum(node * 2 + 1, mid + 1, hi, left, right);
    }

    int n_;
    std::vector<long long> sum_;
    std::vector<long long> max1_;
    std::vector<long long> max2_;
    std::vector<int> count_;
};

int main() {
    int n = 0;
    int q = 0;
    if (std::scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n <= 0) {
        return 0;
    }

    std::vector<long long> values(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        if (std::scanf("%lld", &values[i]) != 1) {
            return 0;
        }
    }

    SegmentTreeBeats tree(n, values);

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (std::scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int left = 0;
            int right = 0;
            long long x = 0;
            if (std::scanf("%d %d %lld", &left, &right, &x) != 3) {
                break;
            }
            tree.chmin(left, right, x);
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
