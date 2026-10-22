#include <iostream>
#include <vector>

// Adjacency list of a graph on vertices 0..n-1: adj[v] holds the neighbors
// of v.
using AdjacencyList = std::vector<std::vector<int>>;

/*
 * Marks v as visited and recurses into the neighbors that are still
 * unvisited. The frame of this call stays on the stack for as long as the
 * subtree of v is explored, so the recursion depth equals the depth of the
 * current path.
 */
static void dfsVisit(const AdjacencyList& adj,
                      int v,
                      std::vector<char>& visited,
                      std::vector<int>& order) {
    visited[static_cast<size_t>(v)] = 1;
    order.push_back(v);

    for (const int w : adj[static_cast<size_t>(v)]) {
        if (!visited[static_cast<size_t>(w)]) {
            dfsVisit(adj, w, visited, order);
        }
    }
}

/**
 * Depth-first search that marks a vertex on entry to the recursive call.
 *
 * Every vertex is entered at most once, so the auxiliary space is the
 * visited array plus one stack frame per vertex on the current path:
 * O(V) in total. The call stack can grow to the depth of the graph, which
 * overflows in C++ and Java on a long chain.
 *
 * adj    adjacency list of the graph
 * source the start vertex
 * returns the visited vertices in visit order
 */
std::vector<int> dfsRecursive(const AdjacencyList& adj, int source) {
    if (source < 0 || source >= static_cast<int>(adj.size())) {
        return {};
    }

    std::vector<char> visited(adj.size(), 0);
    std::vector<int> order;
    dfsVisit(adj, source, visited, order);
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

    const std::vector<int> order = dfsRecursive(adj, source);
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
