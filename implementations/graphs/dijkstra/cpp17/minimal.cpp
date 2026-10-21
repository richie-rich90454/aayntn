#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

// A weighted adjacency list of a graph on vertices 0..n-1: adj[v] holds the
// (neighbour, weight) pairs of the edges incident to v.
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
std::vector<long long> dijkstra(const AdjacencyList& adj, int source) {
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

/*
 * Self-check only: the function above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main() {
    AdjacencyList graph(5);
    graph[0].emplace_back(1, 4);
    graph[0].emplace_back(2, 2);
    graph[1].emplace_back(0, 4);
    graph[1].emplace_back(2, 1);
    graph[2].emplace_back(0, 2);
    graph[2].emplace_back(1, 1);
    graph[2].emplace_back(3, 8);
    graph[3].emplace_back(2, 8);

    const std::vector<long long> distance = dijkstra(graph, 0);
    if (distance.size() != 5) {
        return 1;
    }
    if (distance[0] != 0 || distance[1] != 3 || distance[2] != 2 ||
        distance[3] != 10 || distance[4] != -1) {
        return 1;
    }

    // The start vertex is the only one reachable from an isolated vertex.
    const std::vector<long long> isolated = dijkstra(graph, 4);
    if (isolated[0] != -1 || isolated[3] != -1 || isolated[4] != 0) {
        return 1;
    }

    // A start vertex outside the graph leaves every distance unknown.
    const std::vector<long long> outside = dijkstra(graph, 5);
    if (outside[0] != -1 || outside[4] != -1) {
        return 1;
    }

    return 0;
}
