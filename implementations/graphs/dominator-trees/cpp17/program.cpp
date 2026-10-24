#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

// A directed adjacency list on vertices 0..n-1.
using AdjacencyList = std::vector<std::vector<int>>;

/**
 * The deepest common ancestor of a and b in the partially built dominator
 * tree.
 *
 * order[v] is the position of v in the reverse postorder of the depth-first
 * search, so a vertex and all of its ancestors have smaller numbers than any
 * of its descendants. Climbing the vertex with the larger number is therefore
 * a walk toward the root, and the walk stops when the two meet.
 */
static int intersect(int a, int b, const std::vector<int>& idom, const std::vector<int>& order) {
    while (a != b) {
        while (order[a] > order[b]) {
            a = idom[a];
        }
        while (order[b] > order[a]) {
            b = idom[b];
        }
    }
    return a;
}

/**
 * The immediate dominator of every vertex, found with the iterative dataflow
 * algorithm of Cooper, Harvey and Kennedy.
 *
 * adj    the successor lists
 * pred   the predecessor lists
 * source the start vertex
 * returns the immediate dominator of every vertex and -1 for the vertices the
 *         source cannot reach; the source is its own immediate dominator
 */
static std::vector<int> immediateDominators(const AdjacencyList& adj, const AdjacencyList& pred,
                                            int source) {
    const int n = static_cast<int>(adj.size());
    std::vector<int> idom(static_cast<size_t>(n), -1);
    if (source < 0 || source >= n) {
        return idom;
    }

    // Iterative depth-first search. A vertex enters the postorder when its
    // last successor has been examined, and the reverse of that order is the
    // order the dominator computation needs.
    std::vector<char> visited(static_cast<size_t>(n), 0);
    std::vector<int> nextEdge(static_cast<size_t>(n), 0);
    std::vector<int> postorder;
    postorder.reserve(static_cast<size_t>(n));
    std::vector<int> stack;
    stack.push_back(source);
    visited[static_cast<size_t>(source)] = 1;
    while (!stack.empty()) {
        const int v = stack.back();
        const auto& edges = adj[static_cast<size_t>(v)];
        if (nextEdge[static_cast<size_t>(v)] < static_cast<int>(edges.size())) {
            const int w = edges[static_cast<size_t>(nextEdge[static_cast<size_t>(v)]++)];
            if (!visited[static_cast<size_t>(w)]) {
                visited[static_cast<size_t>(w)] = 1;
                stack.push_back(w);
            }
        } else {
            postorder.push_back(v);
            stack.pop_back();
        }
    }

    const std::vector<int> rpo(postorder.rbegin(), postorder.rend());
    std::vector<int> order(static_cast<size_t>(n), -1);
    for (size_t i = 0; i < rpo.size(); ++i) {
        order[static_cast<size_t>(rpo[i])] = static_cast<int>(i);
    }

    idom[static_cast<size_t>(source)] = source;
    bool changed = true;
    while (changed) {
        changed = false;
        for (size_t i = 1; i < rpo.size(); ++i) {
            const int v = rpo[i];
            int candidate = -1;
            for (const int p : pred[static_cast<size_t>(v)]) {
                if (idom[static_cast<size_t>(p)] == -1) {
                    // The predecessor is not reachable from the source.
                    continue;
                }
                candidate = candidate == -1 ? p : intersect(p, candidate, idom, order);
            }
            if (candidate != -1 && idom[static_cast<size_t>(v)] != candidate) {
                idom[static_cast<size_t>(v)] = candidate;
                changed = true;
            }
        }
    }
    return idom;
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
    int source = -1;
    if (!(std::cin >> n >> m >> source)) {
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
    AdjacencyList pred(static_cast<size_t>(n));
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
        pred[static_cast<size_t>(v)].push_back(u);
    }

    const std::vector<int> idom = immediateDominators(adj, pred, source);

    for (int v = 0; v < n; ++v) {
        if (v > 0) {
            std::cout << ' ';
        }
        if (v == source) {
            std::cout << 0;
        } else {
            std::cout << idom[static_cast<size_t>(v)];
        }
    }
    std::cout << '\n';
    return 0;
}
