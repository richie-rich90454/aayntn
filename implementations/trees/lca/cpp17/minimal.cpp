#include <vector>

/**
 * A binary-lifting table for a tree rooted at one vertex: up_[k * n + v] is
 * the ancestor of v that lies 2^k edges above it, and depth_[v] is the number
 * of edges from the root to v.
 *
 * The vectors own the storage, so the constructor allocates them and the
 * destructor releases them without any explicit destroy call.
 */
class Lca {
public:
    /**
     * @param adj  adjacency list; adj[v] lists the neighbors of the vertex v
     * @param root the root of the tree
     */
    Lca(const std::vector<std::vector<int>>& adj, int root)
        : n_(static_cast<int>(adj.size())),
          levels_(1),
          depth_(static_cast<size_t>(n_), -1),
          up_() {
        if (n_ <= 0 || root < 0 || root >= n_) {
            return;
        }
        while ((1 << levels_) <= n_) {
            levels_++;
        }
        up_.assign(static_cast<size_t>(levels_) * static_cast<size_t>(n_), root);

        // The root is its own ancestor, so the table stays defined everywhere.
        depth_[static_cast<size_t>(root)] = 0;

        std::vector<int> queue(static_cast<size_t>(n_));
        int head = 0;
        int tail = 0;
        queue[static_cast<size_t>(tail++)] = root;
        while (head < tail) {
            const int u = queue[static_cast<size_t>(head++)];
            for (const int w : adj[static_cast<size_t>(u)]) {
                if (depth_[static_cast<size_t>(w)] != -1) {
                    // The vertex was already reached through another edge.
                    continue;
                }
                depth_[static_cast<size_t>(w)] = depth_[static_cast<size_t>(u)] + 1;
                up_[static_cast<size_t>(w)] = u;
                queue[static_cast<size_t>(tail++)] = w;
            }
        }

        // The table of the 2^k ancestors is built from the table of the 2^(k-1).
        for (int k = 1; k < levels_; k++) {
            for (int v = 0; v < n_; v++) {
                const size_t previous = static_cast<size_t>(k - 1) * static_cast<size_t>(n_);
                const size_t current = static_cast<size_t>(k) * static_cast<size_t>(n_);
                const int middle = up_[previous + static_cast<size_t>(v)];
                up_[current + static_cast<size_t>(v)] = up_[previous + static_cast<size_t>(middle)];
            }
        }
    }

    // The ancestor of v that lies 2^k edges above it.
    int lift(int v, int k) const {
        if (v < 0 || v >= n_) {
            return -1;
        }
        if (k < 0) {
            k = 0;
        }
        if (k >= levels_) {
            k = levels_ - 1;
        }
        return up_[static_cast<size_t>(k) * static_cast<size_t>(n_) + static_cast<size_t>(v)];
    }

    // The number of edges from the root to v.
    int depth(int v) const {
        if (v < 0 || v >= n_) {
            return -1;
        }
        return depth_[static_cast<size_t>(v)];
    }

    // The lowest common ancestor of u and v.
    int query(int u, int v) const {
        if (u < 0 || u >= n_ || v < 0 || v >= n_) {
            return -1;
        }
        if (depth_[static_cast<size_t>(u)] < 0 || depth_[static_cast<size_t>(v)] < 0) {
            // A vertex outside the component of the root has no ancestor.
            return -1;
        }
        if (depth_[static_cast<size_t>(u)] < depth_[static_cast<size_t>(v)]) {
            const int swap = u;
            u = v;
            v = swap;
        }

        // Lift the deeper vertex until both stand at the same depth.
        int difference = depth_[static_cast<size_t>(u)] - depth_[static_cast<size_t>(v)];
        for (int k = 0; k < levels_; k++) {
            if ((difference >> k) & 1) {
                u = up_[static_cast<size_t>(k) * static_cast<size_t>(n_) + static_cast<size_t>(u)];
            }
        }
        if (u == v) {
            return u;
        }

        /*
         * From the largest jump downwards, the two vertices either stay
         * together or they both move one step below the common ancestor.
         */
        for (int k = levels_ - 1; k >= 0; k--) {
            const size_t row = static_cast<size_t>(k) * static_cast<size_t>(n_);
            const int ancestor_u = up_[row + static_cast<size_t>(u)];
            const int ancestor_v = up_[row + static_cast<size_t>(v)];
            if (ancestor_u != ancestor_v) {
                u = ancestor_u;
                v = ancestor_v;
            }
        }
        return up_[static_cast<size_t>(u)];
    }

private:
    int n_;
    int levels_;
    std::vector<int> depth_;
    std::vector<int> up_;
};

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    const std::vector<std::vector<int>> adj = {
        {1, 2},
        {0, 3, 4},
        {0},
        {1},
        {1},
    };
    const Lca lca(adj, 0);

    if (lca.query(3, 4) != 1) {
        return 1;
    }
    if (lca.query(2, 3) != 0) {
        return 1;
    }
    if (lca.query(0, 4) != 0) {
        return 1;
    }
    // A vertex is its own lowest common ancestor.
    if (lca.query(3, 3) != 3) {
        return 1;
    }

    if (lca.depth(0) != 0 || lca.depth(1) != 1 || lca.depth(3) != 2) {
        return 1;
    }
    if (lca.lift(3, 0) != 1 || lca.lift(3, 1) != 0) {
        return 1;
    }

    return 0;
}
