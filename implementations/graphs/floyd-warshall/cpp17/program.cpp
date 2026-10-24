#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

namespace {

/*
 * Larger than any shortest path this program can build from two finite values,
 * so the guarded addition below cannot overflow a 64-bit integer.
 */
constexpr long long kInfinity = 4000000000000000000LL;

}  // namespace

int main() {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << '\n';
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    const std::size_t size = static_cast<std::size_t>(n);
    std::vector<std::vector<long long>> distance(size, std::vector<long long>(size, kInfinity));
    for (int v = 0; v < n; ++v) {
        distance[static_cast<std::size_t>(v)][static_cast<std::size_t>(v)] = 0;
    }

    for (int e = 0; e < m; ++e) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (!(std::cin >> u >> v >> w)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        long long& at = distance[static_cast<std::size_t>(u)][static_cast<std::size_t>(v)];
        if (w < at) {
            // Parallel edges are allowed, and only the cheaper one matters.
            at = w;
        }
    }

    for (int k = 0; k < n; ++k) {
        const auto& row_k = distance[static_cast<std::size_t>(k)];
        for (int i = 0; i < n; ++i) {
            auto& row_i = distance[static_cast<std::size_t>(i)];
            const long long through = row_i[static_cast<std::size_t>(k)];
            if (through == kInfinity) {
                continue;
            }
            for (int j = 0; j < n; ++j) {
                const long long rest = row_k[static_cast<std::size_t>(j)];
                if (rest == kInfinity) {
                    continue;
                }
                const long long candidate = through + rest;
                if (candidate < row_i[static_cast<std::size_t>(j)]) {
                    row_i[static_cast<std::size_t>(j)] = candidate;
                }
            }
        }
    }

    for (int v = 0; v < n; ++v) {
        if (distance[static_cast<std::size_t>(v)][static_cast<std::size_t>(v)] < 0) {
            std::cout << "negative cycle\n";
            return 0;
        }
    }

    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (j > 0) {
                std::cout << ' ';
            }
            const long long value = distance[static_cast<std::size_t>(i)][static_cast<std::size_t>(j)];
            std::cout << (value == kInfinity ? -1LL : value);
        }
        std::cout << '\n';
    }
    return 0;
}
