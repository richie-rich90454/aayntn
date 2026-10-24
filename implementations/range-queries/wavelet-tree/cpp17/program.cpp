#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

/*
 * A wavelet tree over a static array, stored level by level (the layout is
 * also called a wavelet matrix). Every level keeps a prefix count of the
 * elements that descend to the left child, and the values are stable
 * partitioned before the next level.
 *
 * Input: n q, then the n values, then q lines "l r k" with 0-based half-open
 * bounds [l, r). Output: one line per query, holding the k-th smallest value
 * in a[l..r).
 */

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q) || n <= 0) {
        return 0;
    }

    std::vector<long long> values(static_cast<std::size_t>(n));
    for (long long &value : values) {
        std::cin >> value;
    }

    std::vector<long long> sorted = values;
    std::sort(sorted.begin(), sorted.end());
    sorted.erase(std::unique(sorted.begin(), sorted.end()), sorted.end());
    const int distinct = static_cast<int>(sorted.size());

    int bits = 0;
    while ((1 << bits) < distinct) {
        bits += 1;
    }

    std::vector<int> cur(static_cast<std::size_t>(n));
    std::vector<int> next(static_cast<std::size_t>(n));
    for (int i = 0; i < n; i++) {
        cur[static_cast<std::size_t>(i)] = static_cast<int>(
            std::lower_bound(sorted.begin(), sorted.end(), values[static_cast<std::size_t>(i)]) -
            sorted.begin());
    }

    std::vector<std::vector<int>> prefix(static_cast<std::size_t>(bits),
                                         std::vector<int>(static_cast<std::size_t>(n) + 1, 0));
    std::vector<int> zeroCount(static_cast<std::size_t>(bits), 0);

    for (int level = 0; level < bits; level++) {
        const int shift = bits - 1 - level;
        int zeros = 0;
        for (int i = 0; i < n; i++) {
            if (((cur[static_cast<std::size_t>(i)] >> shift) & 1) == 0) {
                zeros += 1;
            }
            prefix[static_cast<std::size_t>(level)][static_cast<std::size_t>(i) + 1] = zeros;
        }
        zeroCount[static_cast<std::size_t>(level)] = zeros;

        int zeroPosition = 0;
        int onePosition = zeros;
        for (int i = 0; i < n; i++) {
            const int value = cur[static_cast<std::size_t>(i)];
            if (((value >> shift) & 1) == 0) {
                next[static_cast<std::size_t>(zeroPosition)] = value;
                zeroPosition += 1;
            } else {
                next[static_cast<std::size_t>(onePosition)] = value;
                onePosition += 1;
            }
        }
        std::swap(cur, next);
    }

    std::string output;
    output.reserve(static_cast<std::size_t>(q) * 12);
    for (int query = 0; query < q; query++) {
        int left = 0;
        int right = 0;
        long long k = 0;
        std::cin >> left >> right >> k;

        int rank = 0;
        for (int level = 0; level < bits; level++) {
            const std::vector<int> &pref = prefix[static_cast<std::size_t>(level)];
            const int zerosLeft = pref[static_cast<std::size_t>(left)];
            const int zerosRight = pref[static_cast<std::size_t>(right)];
            const int zeros = zerosRight - zerosLeft;
            if (k <= static_cast<long long>(zeros)) {
                left = zerosLeft;
                right = zerosRight;
                rank <<= 1;
            } else {
                k -= static_cast<long long>(zeros);
                const int base = zeroCount[static_cast<std::size_t>(level)];
                left = base + (left - zerosLeft);
                right = base + (right - zerosRight);
                rank = (rank << 1) | 1;
            }
        }
        output += std::to_string(sorted[static_cast<std::size_t>(rank)]);
        output += '\n';
    }

    std::cout << output;
    return 0;
}
