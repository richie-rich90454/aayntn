#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << "0\n\n";
        return 0;
    }

    std::vector<std::vector<long long>> cost(n, std::vector<long long>(n));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            std::cin >> cost[i][j];
        }
    }

    const long long infinity = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> u(n + 1, 0);
    std::vector<long long> v(n + 1, 0);
    std::vector<long long> minv(n + 1, infinity);
    std::vector<int> p(n + 1, 0);
    std::vector<int> way(n + 1, 0);
    std::vector<char> used(n + 1, 0);

    // Row minima are feasible dual potentials for costs of either sign.
    for (int i = 1; i <= n; ++i) {
        u[i] = *std::min_element(cost[i - 1].begin(), cost[i - 1].end());
    }

    for (int i = 1; i <= n; ++i) {
        p[0] = i;
        int j0 = 0;
        std::fill(minv.begin(), minv.end(), infinity);
        std::fill(used.begin(), used.end(), 0);
        do {
            used[j0] = 1;
            const int i0 = p[j0];
            long long delta = infinity;
            int j1 = 0;
            for (int j = 1; j <= n; ++j) {
                if (used[j]) {
                    continue;
                }
                const long long cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
                if (cur < minv[j]) {
                    minv[j] = cur;
                    way[j] = j0;
                }
                if (minv[j] < delta) {
                    delta = minv[j];
                    j1 = j;
                }
            }
            for (int j = 0; j <= n; ++j) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            j0 = j1;
        } while (p[j0] != 0);
        do {
            const int j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0 != 0);
    }

    std::vector<int> assignment(n);
    for (int j = 1; j <= n; ++j) {
        assignment[p[j] - 1] = j - 1;
    }
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        total += cost[i][assignment[i]];
    }

    std::cout << total << '\n';
    for (int i = 0; i < n; ++i) {
        if (i > 0) {
            std::cout << ' ';
        }
        std::cout << assignment[i];
    }
    std::cout << '\n';
    return 0;
}
