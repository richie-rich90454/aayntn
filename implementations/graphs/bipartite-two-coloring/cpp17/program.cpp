#include <iostream>
#include <vector>

// Adjacency list of an undirected graph on vertices 0..n-1.
using AdjacencyList = std::vector<std::vector<int>>;

/**
 * Two-colors an undirected graph, one connected component at a time.
 *
 * A vertex receives the opposite color of the vertex that discovered it, so
 * its color is the parity of its breadth-first distance from the root of its
 * component. The test fails when an edge joins two vertices of the same
 * parity, because that edge closes an odd cycle.
 *
 * adj     adjacency list of the graph
 * color   receives the color of every vertex, 0 or 1
 * returns true when the graph is bipartite and false otherwise
 */
static bool twoColor(const AdjacencyList& adj, std::vector<int>& color) {
    const int n = static_cast<int>(adj.size());
    color.assign(static_cast<size_t>(n), -1);

    std::vector<int> queue;
    queue.reserve(static_cast<size_t>(n));

    for (int s = 0; s < n; s++) {
        if (color[static_cast<size_t>(s)] != -1) {
            // This component was already colored.
            continue;
        }
        color[static_cast<size_t>(s)] = 0;
        queue.clear();
        queue.push_back(s);

        size_t front = 0;
        while (front < queue.size()) {
            const int u = queue[front++];
            for (const int v : adj[static_cast<size_t>(u)]) {
                if (color[static_cast<size_t>(v)] == -1) {
                    color[static_cast<size_t>(v)] =
                        color[static_cast<size_t>(u)] ^ 1;
                    queue.push_back(v);
                } else if (color[static_cast<size_t>(v)] ==
                           color[static_cast<size_t>(u)]) {
                    // The edge closes an odd cycle.
                    return false;
                }
            }
        }
    }
    return true;
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
    if (m < 0) {
        m = 0;
    }

    AdjacencyList adj(static_cast<size_t>(n));
    for (int i = 0; i < m; i++) {
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

    std::vector<int> color;
    if (!twoColor(adj, color)) {
        std::cout << -1 << '\n';
        return 0;
    }

    for (int v = 0; v < n; v++) {
        if (v > 0) {
            std::cout << ' ';
        }
        std::cout << color[static_cast<size_t>(v)];
    }
    std::cout << '\n';
    return 0;
}
