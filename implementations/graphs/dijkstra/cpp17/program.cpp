#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

// A weighted adjacency list of a graph on vertices 0..n-1: adj[v] holds the
// (neighbor, weight) pairs of the edges incident to v.
using AdjacencyList = std::vector<std::vector<std::pair<int, long long>>>;

/**
 * Dijkstra's algorithm from source over a graph whose edge weights are all
 * nonnegative.
 *
 * The priority queue holds (distance, vertex) pairs and an entry is never
 * removed from the middle of the queue: a shorter path to a vertex pushes a
 * second entry and the stale one is discarded when it surfaces. That replaces a
 * decrease-key operation by at most one extra entry per successful relaxation,
 * so the queue holds O(E) entries.
 *
 * adj    adjacency list of the graph
 * source the start vertex
 * returns the distance from source to every vertex, and -1 for the vertices
 *         source cannot reach
 */
static std::vector<long long> dijkstra(const AdjacencyList& adj, int source) {
    const int n = static_cast<int>(adj.size());
    std::vector<long long> distance(static_cast<size_t>(n), -1);
    if (source < 0 || source >= n) {
        return distance;
    }

    using QueueEntry = std::pair<long long, int>;
    std::priority_queue<QueueEntry, std::vector<QueueEntry>, std::greater<QueueEntry>> heap;

    distance[static_cast<size_t>(source)] = 0;
    heap.emplace(0LL, source);
    while (!heap.empty()) {
        const QueueEntry top = heap.top();
        heap.pop();
        const int v = top.second;
        if (top.first != distance[static_cast<size_t>(v)]) {
            // A shorter path was found after this entry was pushed.
            continue;
        }
        for (const auto& edge : adj[static_cast<size_t>(v)]) {
            const int w = edge.first;
            const long long candidate = top.first + edge.second;
            if (distance[static_cast<size_t>(w)] >= 0 &&
                candidate >= distance[static_cast<size_t>(w)]) {
                // The relaxation would not improve the distance.
                continue;
            }
            distance[static_cast<size_t>(w)] = candidate;
            heap.emplace(candidate, w);
        }
    }
    return distance;
}

int main() {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

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

    AdjacencyList adj(static_cast<size_t>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (!(std::cin >> u >> v >> w)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
            continue;
        }
        adj[static_cast<size_t>(u)].emplace_back(v, w);
        adj[static_cast<size_t>(v)].emplace_back(u, w);
    }

    int source = -1;
    if (!(std::cin >> source)) {
        source = -1;
    }

    const std::vector<long long> distance = dijkstra(adj, source);

    for (int v = 0; v < n; ++v) {
        if (v > 0) {
            std::cout << ' ';
        }
        std::cout << distance[static_cast<size_t>(v)];
    }
    std::cout << '\n';
    return 0;
}
