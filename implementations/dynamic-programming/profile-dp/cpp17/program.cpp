#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

/**
 * Count the tilings of an r x c grid with 1 x 2 and 2 x 1 dominoes.
 *
 * Input: r c, then r strings of c characters. '0' is a free cell and '1' is
 * blocked.
 * Output: the number of ways to cover every free cell exactly once.
 *
 * Before cell k the mask describes the next c cells: bit d is 1 when cell
 * k + d is already covered by a domino placed earlier. Bit 0 is cell k.
 */
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int r = 0;
    int c = 0;
    if (!(std::cin >> r >> c)) {
        return 0;
    }
    if (r <= 0 || c <= 0) {
        std::cout << "1\n";
        return 0;
    }

    std::vector<std::string> grid(static_cast<size_t>(r),
                                  std::string(static_cast<size_t>(c), '0'));
    for (int i = 0; i < r; ++i) {
        std::string row;
        if (!(std::cin >> row)) {
            break;
        }
        for (int j = 0; j < c && j < static_cast<int>(row.size()); ++j) {
            grid[static_cast<size_t>(i)][static_cast<size_t>(j)] = row[static_cast<size_t>(j)];
        }
    }

    const int size = 1 << c;
    std::vector<long long> dp(static_cast<size_t>(size), 0);
    std::vector<long long> next(static_cast<size_t>(size), 0);
    dp[0] = 1;

    for (int i = 0; i < r; ++i) {
        for (int j = 0; j < c; ++j) {
            std::fill(next.begin(), next.end(), 0);
            for (int mask = 0; mask < size; ++mask) {
                const long long ways = dp[static_cast<size_t>(mask)];
                if (ways == 0) {
                    continue;
                }
                const int base = mask >> 1;

                if (grid[static_cast<size_t>(i)][static_cast<size_t>(j)] == '1') {
                    if ((mask & 1) == 0) {
                        next[static_cast<size_t>(base)] += ways;
                    }
                } else if ((mask & 1) != 0) {
                    next[static_cast<size_t>(base)] += ways;
                } else {
                    if (j + 1 < c && grid[static_cast<size_t>(i)][static_cast<size_t>(j + 1)] == '0' &&
                        (mask & 2) == 0) {
                        next[static_cast<size_t>(base | 1)] += ways;
                    }
                    if (i + 1 < r &&
                        grid[static_cast<size_t>(i + 1)][static_cast<size_t>(j)] == '0') {
                        next[static_cast<size_t>(base | (1 << (c - 1)))] += ways;
                    }
                }
            }
            dp.swap(next);
        }
    }

    std::cout << dp[0] << '\n';
    return 0;
}
