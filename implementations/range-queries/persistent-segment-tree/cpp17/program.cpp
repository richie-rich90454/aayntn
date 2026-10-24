#include <algorithm>
#include <cstdio>
#include <vector>

/*
 * Persistent segment tree over the compressed values of a static array.
 *
 * Version i is the frequency tree of a[0..i), built from version i - 1 by
 * copying only the root-to-leaf path of the inserted value. The difference
 * between version r and version l - 1 is the frequency tree of a[l-1..r), so
 * one descent that subtracts the two left counts returns the k-th smallest.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

class PersistentTree {
  public:
    explicit PersistentTree(int capacity)
        : left_child_(static_cast<size_t>(capacity)),
          right_child_(static_cast<size_t>(capacity)),
          count_(static_cast<size_t>(capacity)) {}

    int update(int previous, int low, int high, int position) {
        int node = ++nodes_;
        left_child_[node] = left_child_[previous];
        right_child_[node] = right_child_[previous];
        count_[node] = count_[previous] + 1;
        if (low < high) {
            int middle = low + (high - low) / 2;
            if (position <= middle) {
                left_child_[node] = update(left_child_[previous], low, middle, position);
            } else {
                right_child_[node] = update(right_child_[previous], middle + 1, high, position);
            }
        }
        return node;
    }

    int kth(int before, int after, int low, int high, int k) const {
        while (low < high) {
            int middle = low + (high - low) / 2;
            int in_left = count_[left_child_[after]] - count_[left_child_[before]];
            if (k <= in_left) {
                before = left_child_[before];
                after = left_child_[after];
                high = middle;
            } else {
                k -= in_left;
                before = right_child_[before];
                after = right_child_[after];
                low = middle + 1;
            }
        }
        return low;
    }

  private:
    std::vector<int> left_child_;
    std::vector<int> right_child_;
    std::vector<int> count_;
    int nodes_ = 0;
};

int main() {
    int n = 0;
    int q = 0;
    if (std::scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    std::vector<long long> values(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) {
        if (std::scanf("%lld", &values[i]) != 1) {
            return 0;
        }
    }

    std::vector<long long> sorted = values;
    std::sort(sorted.begin(), sorted.end());
    sorted.erase(std::unique(sorted.begin(), sorted.end()), sorted.end());
    int m = static_cast<int>(sorted.size());

    int depth = 0;
    while ((1LL << depth) < m) {
        ++depth;
    }
    PersistentTree tree(static_cast<int>((n + 1LL) * (depth + 2) + 1));

    std::vector<int> roots(static_cast<size_t>(n + 1), 0);
    for (int i = 1; i <= n; ++i) {
        int position = static_cast<int>(std::lower_bound(sorted.begin(), sorted.end(),
                                                         values[i - 1]) -
                                        sorted.begin()) +
                       1;
        roots[i] = tree.update(roots[i - 1], 1, m, position);
    }

    for (int query = 0; query < q; ++query) {
        int left = 0;
        int right = 0;
        int k = 0;
        if (std::scanf("%d %d %d", &left, &right, &k) != 3) {
            break;
        }
        int answer = tree.kth(roots[left - 1], roots[right], 1, m, k);
        std::printf("%lld\n", sorted[answer - 1]);
    }
    return 0;
}
