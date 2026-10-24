#include <algorithm>
#include <iostream>
#include <vector>

/*
 * A merge sort tree over a static array: every node of a segment tree stores
 * the sorted values of its interval, and a rank query binary searches the
 * O(log n) nodes that partition the requested range.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

namespace {

int upperBound(const std::vector<long long>& values, long long limit) {
    return static_cast<int>(std::upper_bound(values.begin(), values.end(), limit) - values.begin());
}

long long countAtMost(const std::vector<std::vector<long long>>& tree, int size, int left,
                      int right, long long limit) {
    long long total = 0;
    for (int l = left + size, r = right + size; l < r; l >>= 1, r >>= 1) {
        if ((l & 1) != 0) {
            total += upperBound(tree[l], limit);
            l += 1;
        }
        if ((r & 1) != 0) {
            r -= 1;
            total += upperBound(tree[r], limit);
        }
    }
    return total;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q) || n <= 0) {
        return 0;
    }

    std::vector<long long> values(n);
    for (long long& value : values) {
        std::cin >> value;
    }

    int size = 1;
    while (size < n) {
        size *= 2;
    }

    std::vector<std::vector<long long>> tree(static_cast<std::size_t>(2 * size));
    for (int i = 0; i < n; i++) {
        tree[static_cast<std::size_t>(size + i)] = {values[static_cast<std::size_t>(i)]};
    }
    for (int i = size - 1; i >= 1; i--) {
        const std::vector<long long>& left = tree[static_cast<std::size_t>(2 * i)];
        const std::vector<long long>& right = tree[static_cast<std::size_t>(2 * i + 1)];
        std::vector<long long>& node = tree[static_cast<std::size_t>(i)];
        node.resize(left.size() + right.size());
        std::merge(left.begin(), left.end(), right.begin(), right.end(), node.begin());
    }

    const long long minimum = *std::min_element(values.begin(), values.end());
    const long long maximum = *std::max_element(values.begin(), values.end());

    for (int query = 0; query < q; query++) {
        int left = 0;
        int right = 0;
        long long k = 0;
        std::cin >> left >> right >> k;

        /* The least value whose rank in the range reaches k is the k-th
         * smallest, and the rank is monotone in the value. */
        long long low = minimum;
        long long high = maximum;
        while (low < high) {
            const long long middle = low + (high - low) / 2;
            if (countAtMost(tree, size, left - 1, right, middle) >= k) {
                high = middle;
            } else {
                low = middle + 1;
            }
        }
        std::cout << low << '\n';
    }

    return 0;
}
