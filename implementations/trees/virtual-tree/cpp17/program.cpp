#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * The ancestor table of a rooted weighted tree, with the preorder interval of
 * every vertex. up[k * n + v] is the ancestor of v that lies 2^k edges above
 * it, depth[v] counts edges and distance[v] sums edge weights.
 */
struct Tree {
    int n = 0;
    int levels = 1;
    std::vector<int> parent;
    std::vector<int> depth;
    std::vector<int> tin;
    std::vector<int> tout;
    std::vector<long long> distance;
    std::vector<int> up;

    void build(const std::vector<std::vector<std::pair<int, long long>>>& adj) {
        n = static_cast<int>(adj.size());
        while ((1 << levels) <= n) {
            levels++;
        }
        parent.assign(static_cast<size_t>(n), -1);
        depth.assign(static_cast<size_t>(n), -1);
        tin.assign(static_cast<size_t>(n), -1);
        tout.assign(static_cast<size_t>(n), -1);
        distance.assign(static_cast<size_t>(n), 0);
        up.assign(static_cast<size_t>(levels) * static_cast<size_t>(n), 0);
        if (n <= 0) {
            return;
        }

        std::vector<int> cursor(static_cast<size_t>(n), 0);
        std::vector<int> stack;
        stack.reserve(static_cast<size_t>(n));
        parent[0] = 0;
        depth[0] = 0;
        tin[0] = 0;
        int timer = 1;
        stack.push_back(0);
        while (!stack.empty()) {
            const int v = stack.back();
            int e = cursor[static_cast<size_t>(v)];
            while (e < static_cast<int>(adj[static_cast<size_t>(v)].size()) &&
                   parent[static_cast<size_t>(adj[static_cast<size_t>(v)][static_cast<size_t>(e)].first)] !=
                       -1) {
                e++;
            }
            cursor[static_cast<size_t>(v)] = e;
            if (e == static_cast<int>(adj[static_cast<size_t>(v)].size())) {
                tout[static_cast<size_t>(v)] = timer;
                stack.pop_back();
                continue;
            }
            cursor[static_cast<size_t>(v)] = e + 1;
            const int u = adj[static_cast<size_t>(v)][static_cast<size_t>(e)].first;
            const long long w = adj[static_cast<size_t>(v)][static_cast<size_t>(e)].second;
            parent[static_cast<size_t>(u)] = v;
            depth[static_cast<size_t>(u)] = depth[static_cast<size_t>(v)] + 1;
            distance[static_cast<size_t>(u)] = distance[static_cast<size_t>(v)] + w;
            tin[static_cast<size_t>(u)] = timer;
            timer++;
            stack.push_back(u);
        }

        // The root is its own ancestor, so every entry of the table is defined.
        for (int v = 0; v < n; v++) {
            up[static_cast<size_t>(v)] =
                parent[static_cast<size_t>(v)] >= 0 ? parent[static_cast<size_t>(v)] : v;
        }
        for (int k = 1; k < levels; k++) {
            for (int v = 0; v < n; v++) {
                const int middle = up[static_cast<size_t>((k - 1) * n + v)];
                up[static_cast<size_t>(k * n + v)] =
                    up[static_cast<size_t>((k - 1) * n + middle)];
            }
        }
    }

    int lca(int u, int v) const {
        if (u < 0 || u >= n || v < 0 || v >= n) {
            return -1;
        }
        if (depth[static_cast<size_t>(u)] < 0 || depth[static_cast<size_t>(v)] < 0) {
            return -1;
        }
        if (depth[static_cast<size_t>(u)] < depth[static_cast<size_t>(v)]) {
            const int swap = u;
            u = v;
            v = swap;
        }
        int difference = depth[static_cast<size_t>(u)] - depth[static_cast<size_t>(v)];
        for (int k = 0; difference > 0; k++) {
            if ((difference & 1) != 0) {
                u = up[static_cast<size_t>(k * n + u)];
            }
            difference >>= 1;
        }
        if (u == v) {
            return u;
        }
        for (int k = levels - 1; k >= 0; k--) {
            const int ancestor_u = up[static_cast<size_t>(k * n + u)];
            const int ancestor_v = up[static_cast<size_t>(k * n + v)];
            if (ancestor_u != ancestor_v) {
                u = ancestor_u;
                v = ancestor_v;
            }
        }
        return up[static_cast<size_t>(u)];
    }

    bool is_ancestor(int u, int v) const {
        return tin[static_cast<size_t>(u)] <= tin[static_cast<size_t>(v)] &&
               tin[static_cast<size_t>(v)] < tout[static_cast<size_t>(u)];
    }
};

int main() {
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
    if (n < 0) {
        n = 0;
    }
    if (m < 0) {
        m = 0;
    }

    std::vector<std::vector<std::pair<int, long long>>> adj(static_cast<size_t>(n));
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (!(std::cin >> u >> v >> w)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[static_cast<size_t>(u)].push_back({v, w});
        adj[static_cast<size_t>(v)].push_back({u, w});
    }

    Tree tree;
    tree.build(adj);

    int q = 0;
    if (!(std::cin >> q)) {
        q = 0;
    }
    if (q < 0) {
        q = 0;
    }

    std::vector<int> stamp(static_cast<size_t>(n), 0);
    std::vector<int> marks;
    std::vector<int> nodes;
    std::vector<int> stack;
    int query_id = 0;
    for (int query = 0; query < q; query++) {
        int k = 0;
        if (!(std::cin >> k)) {
            break;
        }
        if (k < 0) {
            k = 0;
        }
        query_id++;
        marks.clear();
        for (int i = 0; i < k; i++) {
            int v = -1;
            if (!(std::cin >> v)) {
                break;
            }
            if (v >= 0 && v < n && tree.depth[static_cast<size_t>(v)] >= 0 &&
                stamp[static_cast<size_t>(v)] != query_id) {
                stamp[static_cast<size_t>(v)] = query_id;
                marks.push_back(v);
            }
        }
        if (marks.size() < 2) {
            std::cout << 0 << '\n';
            continue;
        }

        std::sort(marks.begin(), marks.end(),
                  [&tree](int a, int b) {
                      return tree.tin[static_cast<size_t>(a)] <
                             tree.tin[static_cast<size_t>(b)];
                  });

        nodes = marks;
        nodes.reserve(2 * marks.size());
        for (size_t i = 0; i + 1 < marks.size(); i++) {
            const int ancestor = tree.lca(marks[i], marks[i + 1]);
            if (ancestor >= 0) {
                nodes.push_back(ancestor);
            }
        }
        std::sort(nodes.begin(), nodes.end(), [&tree](int a, int b) {
            return tree.tin[static_cast<size_t>(a)] < tree.tin[static_cast<size_t>(b)];
        });
        nodes.erase(std::unique(nodes.begin(), nodes.end()), nodes.end());

        long long total = 0;
        stack.clear();
        for (const int v : nodes) {
            while (!stack.empty() && !tree.is_ancestor(stack.back(), v)) {
                stack.pop_back();
            }
            if (!stack.empty()) {
                total += tree.distance[static_cast<size_t>(v)] -
                         tree.distance[static_cast<size_t>(stack.back())];
            }
            stack.push_back(v);
        }
        std::cout << total << '\n';
    }

    return 0;
}
