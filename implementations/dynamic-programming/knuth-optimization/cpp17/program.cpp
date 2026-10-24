#include <iostream>
#include <vector>

/**
 * Matrix chain multiplication with the monotone split window.
 *
 * Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
 * p[i] by p[i + 1], for 0 <= i < n.
 * Output: the minimum number of scalar multiplications.
 *
 * The split for a range [i, j] is only searched in
 * [opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic
 * interval table into a quadratic one.
 */
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << "0\n";
        return 0;
    }

    std::vector<long long> p(static_cast<size_t>(n + 1), 1);
    for (int i = 0; i <= n; ++i) {
        if (!(std::cin >> p[static_cast<size_t>(i)])) {
            p[static_cast<size_t>(i)] = 1;
        }
    }

    std::vector<long long> dp(static_cast<size_t>(n) * static_cast<size_t>(n), 0);
    std::vector<int> opt(static_cast<size_t>(n) * static_cast<size_t>(n), 0);
    for (int i = 0; i < n; ++i) {
        opt[static_cast<size_t>(i) * n + i] = i;
    }

    for (int length = 2; length <= n; ++length) {
        for (int i = 0; i + length <= n; ++i) {
            const int j = i + length - 1;
            int lo = opt[static_cast<size_t>(i) * n + (j - 1)];
            int hi = opt[static_cast<size_t>(i + 1) * n + j];
            if (lo < i) {
                lo = i;
            }
            if (hi > j - 1) {
                hi = j - 1;
            }
            if (lo > hi) {
                lo = i;
                hi = j - 1;
            }

            long long best = -1;
            int best_k = lo;
            for (int k = lo; k <= hi; ++k) {
                const long long cost = dp[static_cast<size_t>(i) * n + k] +
                                       dp[static_cast<size_t>(k + 1) * n + j] +
                                       p[static_cast<size_t>(i)] *
                                           p[static_cast<size_t>(k + 1)] *
                                           p[static_cast<size_t>(j + 1)];
                if (best < 0 || cost < best) {
                    best = cost;
                    best_k = k;
                }
            }
            dp[static_cast<size_t>(i) * n + j] = best;
            opt[static_cast<size_t>(i) * n + j] = best_k;
        }
    }

    std::cout << dp[static_cast<size_t>(n - 1)] << '\n';
    return 0;
}
