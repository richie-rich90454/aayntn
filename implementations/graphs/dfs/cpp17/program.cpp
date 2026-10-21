#include <iostream>
#include <vector>

// Adjacency list of a graph on vertices 0..n-1: adj[v] holds the neighbours
// of v.
using AdjacencyList = std::vector<std::vector<int>>;

/**
 * Depth-first search over an unweighted graph: the stack replaces the call
 * stack, so a chain of any length is traversed without recursion.
 *
 * adj    adjacency list of the graph
 * source the start vertex
 * returns the visited vertices in visit order
 */
static std::vector<int> dfsReachable(const AdjacencyList& adj, int source) {
    if (source < 0 || source >= static_cast<int>(adj.size())) {
        return {};
    }

    std::vector<char> visited(adj.size(), 0);
    std::vector<int> stack;
    std::vector<int> order;

    stack.push_back(source);
    while (!stack.empty()) {
        const int v = stack.back();
        stack.pop_back();
        if (visited[v]) {
            // The vertex was already reached through another edge.
            continue;
        }
        visited[v] = 1;
        order.push_back(v);

        for (const int w : adj[static_cast<size_t>(v)]) {
            if (!visited[static_cast<size_t>(w)]) {
                stack.push_back(w);
            }
        }
    }
    return order;
}

int main() {
    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << "0\n\n";
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

    const std::vector<int> order = dfsReachable(adj, source);
    std::vector<char> reachable(static_cast<size_t>(n), 0);
    for (const int v : order) {
        reachable[static_cast<size_t>(v)] = 1;
    }

    std::cout << order.size() << '\n';
    bool first = true;
    for (int v = 0; v < n; ++v) {
        if (!reachable[static_cast<size_t>(v)]) {
            continue;
        }
        if (!first) {
            std::cout << ' ';
        }
        std::cout << v;
        first = false;
    }
    std::cout << '\n';
    return 0;
}
