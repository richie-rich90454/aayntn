#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
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

struct Edge {
    int from;
    int to;
    long long weight;
};

struct Arc {
    int to;
    long long weight;
};

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

    std::vector<Edge> edges;
    edges.reserve(static_cast<std::size_t>(m));
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
        edges.push_back({u, v, w});
    }

    /*
     * Every vertex starts at zero, as if a virtual source were joined to it by
     * an edge of weight zero. n relaxation passes then either produce the
     * potentials or expose a negative cycle.
     */
    std::vector<long long> height(static_cast<std::size_t>(n), 0);
    bool negative_cycle = false;
    for (int pass = 0; pass < n; ++pass) {
        bool changed = false;
        for (const Edge& edge : edges) {
            const long long candidate = height[static_cast<std::size_t>(edge.from)] + edge.weight;
            if (candidate < height[static_cast<std::size_t>(edge.to)]) {
                height[static_cast<std::size_t>(edge.to)] = candidate;
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
        if (pass == n - 1) {
            negative_cycle = true;
        }
    }
    if (negative_cycle) {
        std::cout << "NEGATIVE CYCLE\n";
        return 0;
    }

    std::vector<std::vector<Arc>> adjacency(static_cast<std::size_t>(n));
    for (const Edge& edge : edges) {
        /* The reduced weight is nonnegative: height[v] <= height[u] + w. */
        const long long reduced =
            edge.weight + height[static_cast<std::size_t>(edge.from)] -
            height[static_cast<std::size_t>(edge.to)];
        adjacency[static_cast<std::size_t>(edge.from)].push_back({edge.to, reduced});
    }

    using Entry = std::pair<long long, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> heap;
    std::vector<long long> distance(static_cast<std::size_t>(n));

    for (int source = 0; source < n; ++source) {
        std::fill(distance.begin(), distance.end(), kInfinity);
        distance[static_cast<std::size_t>(source)] = 0;
        heap.push({0, source});
        while (!heap.empty()) {
            const Entry current = heap.top();
            heap.pop();
            const int v = current.second;
            if (current.first != distance[static_cast<std::size_t>(v)]) {
                continue;
            }
            for (const Arc& arc : adjacency[static_cast<std::size_t>(v)]) {
                const long long candidate = current.first + arc.weight;
                if (candidate < distance[static_cast<std::size_t>(arc.to)]) {
                    distance[static_cast<std::size_t>(arc.to)] = candidate;
                    heap.push({candidate, arc.to});
                }
            }
        }
        for (int v = 0; v < n; ++v) {
            if (v > 0) {
                std::cout << ' ';
            }
            if (distance[static_cast<std::size_t>(v)] == kInfinity) {
                std::cout << -1;
            } else {
                std::cout << distance[static_cast<std::size_t>(v)] -
                                 height[static_cast<std::size_t>(source)] +
                                 height[static_cast<std::size_t>(v)];
            }
        }
        std::cout << '\n';
    }
    return 0;
}
