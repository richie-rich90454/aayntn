#include <cstdio>
#include <vector>

namespace {
constexpr int MOD = 1000000007;

/*
 * Subset zeta transform.
 *
 * Input: n, then the 2^n values f[0] .. f[2^n - 1], one value per mask.
 * Output: g[0] .. g[2^n - 1], where g[S] is the sum of f[T] over T subset of S,
 * reduced modulo 1000000007.
 *
 * The two halves of every block of size 2^(bit + 1) are the masks whose bit is
 * zero and the masks whose bit is one. The first half is unchanged during the
 * pass, so the update is safe in place.
 */
}  // namespace

int main() {
    int n = 0;
    if (std::scanf("%d", &n) != 1) {
        return 0;
    }
    if (n < 0 || n > 24) {
        return 0;
    }

    const int total = 1 << n;
    std::vector<int> g(total);
    for (int mask = 0; mask < total; mask++) {
        if (std::scanf("%d", &g[mask]) != 1) {
            g[mask] = 0;
        }
    }

    for (int bit = 0; bit < n; bit++) {
        const int step = 1 << bit;
        for (int base = 0; base < total; base += step << 1) {
            for (int off = 0; off < step; off++) {
                int &target = g[base + step + off];
                target += g[base + off];
                if (target >= MOD) {
                    target -= MOD;
                }
            }
        }
    }

    for (int mask = 0; mask < total; mask++) {
        std::printf("%s%d", mask == 0 ? "" : " ", g[mask]);
    }
    std::printf("\n");
    return 0;
}
