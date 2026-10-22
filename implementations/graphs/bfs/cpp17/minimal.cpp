#include <iostream>
#include <vector>

// Adjacency list of a graph on vertices 0..n-1: adj[v] holds the neighbors
// of v.
using AdjacencyList = std::vector<std::vector<int>>;

/**
 * Breadth-first search from source over an unweighted graph.
 *
 * The queue holds the frontier, so the vertices leave it in order of
 * increasing distance from source: the first time a vertex is discovered its
 * distance is already the length of a shortest path to it.
 *
 * adj    adjacency list of the graph
 * source the start vertex
 * returns the distance from source to every vertex, and -1 for the vertices
 * source cannot reach
 */
std::vector<int> bfsDistances(const AdjacencyList& adj, int source) {
    std::vector<int> distance(adj.size(), -1);
    if (source < 0 || source >= static_cast<int>(adj.size())) {
        return distance;
    }

    std::vector<int> queue;
    queue.reserve(adj.size());

    size_t head = 0;
    queue.push_back(source);
    distance[static_cast<size_t>(source)] = 0;

    while (head < queue.size()) {
        const int v = queue[head++];
        for (const int w : adj[static_cast<size_t>(v)]) {
            if (distance[static_cast<size_t>(w)] >= 0) {
                // The vertex was already discovered.
                continue;
            }
            distance[static_cast<size_t>(w)] = distance[static_cast<size_t>(v)] + 1;
            queue.push_back(w);
        }
    }
    return distance;
}

int main() {
    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << '\n';
        return 0;
    }

    AdjacencyList adj(n);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        if (!(std::cin >> u >> v)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[static_cast<size_t>(u)].push_back(v);
        adj[static_cast<size_t>(v)].push_back(u);
    }

    int source = -1;
    if (!(std::cin >> source)) {
        source = -1;
    }

    const std::vector<int> distance = bfsDistances(adj, source);

    for (int v = 0; v < n; ++v) {
        if (v > 0) {
            std::cout << ' ';
        }
        std::cout << distance[static_cast<size_t>(v)];
    }
    std::cout << '\n';
    return 0;
}
