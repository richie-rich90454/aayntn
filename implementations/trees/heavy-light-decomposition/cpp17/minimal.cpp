#include <vector>

/**
 * A heavy-light decomposition of a tree rooted at one vertex: size_ holds the
 * number of vertices in the subtree of a vertex, heavy_ the child with the
 * largest subtree, head_ the top of the chain of a vertex and pos_ its index
 * in the flattened array.
 *
 * The vectors own the storage, so the constructor allocates them and the
 * destructor releases them without any explicit destroy call.
 */
class Hld {
public:
    /**
     * @param adj    adjacency list; adj[v] lists the neighbours of the vertex v
     * @param root   the root of the tree
     * @param values the value of every vertex, so values[v] is the value of
     *   the vertex v
     */
    Hld(const std::vector<std::vector<int>>& adj, int root,
        const std::vector<long long>& values)
        : n_(static_cast<int>(adj.size())),
          parent_(static_cast<size_t>(n_), 0),
          depth_(static_cast<size_t>(n_), -1),
          size_(static_cast<size_t>(n_), 1),
          heavy_(static_cast<size_t>(n_), -1),
          head_(static_cast<size_t>(n_), 0),
          pos_(static_cast<size_t>(n_), 0),
          flat_(static_cast<size_t>(n_), 0),
          prefix_(static_cast<size_t>(n_ > 0 ? n_ : 1) + 1, 0) {
        if (n_ <= 0 || root < 0 || root >= n_) {
            return;
        }

        // A breadth-first walk from the root fixes the parents and the depths.
        parent_[static_cast<size_t>(root)] = root;
        depth_[static_cast<size_t>(root)] = 0;
        std::vector<int> order(static_cast<size_t>(n_));
        int head = 0;
        int tail = 0;
        order[static_cast<size_t>(tail++)] = root;
        while (head < tail) {
            const int u = order[static_cast<size_t>(head++)];
            for (const int w : adj[static_cast<size_t>(u)]) {
                if (depth_[static_cast<size_t>(w)] != -1) {
                    // The vertex was already reached through another edge.
                    continue;
                }
                depth_[static_cast<size_t>(w)] = depth_[static_cast<size_t>(u)] + 1;
                parent_[static_cast<size_t>(w)] = u;
                order[static_cast<size_t>(tail++)] = w;
            }
        }

        /*
         * The subtree sizes are known from the leaves upwards, and the heavy
         * child of a vertex is the child with the largest subtree.
         */
        for (int i = tail - 1; i >= 0; i--) {
            const int u = order[static_cast<size_t>(i)];
            for (const int w : adj[static_cast<size_t>(u)]) {
                if (w == u || parent_[static_cast<size_t>(w)] != u) {
                    // The vertex is not a child of u.
                    continue;
                }
                size_[static_cast<size_t>(u)] += size_[static_cast<size_t>(w)];
                const int current = heavy_[static_cast<size_t>(u)];
                if (current == -1 ||
                    size_[static_cast<size_t>(w)] > size_[static_cast<size_t>(current)]) {
                    heavy_[static_cast<size_t>(u)] = w;
                }
            }
        }

        /*
         * The flattened array holds one chain after the other, so the
         * vertices of a chain occupy a contiguous range of indices.
         */
        int timer = 0;
        for (int i = 0; i < tail; i++) {
            const int v = order[static_cast<size_t>(i)];
            if (v != root && heavy_[static_cast<size_t>(parent_[static_cast<size_t>(v)])] == v) {
                // The vertex continues the chain of its parent.
                continue;
            }
            for (int u = v; u != -1; u = heavy_[static_cast<size_t>(u)]) {
                head_[static_cast<size_t>(u)] = v;
                pos_[static_cast<size_t>(u)] = timer;
                flat_[static_cast<size_t>(timer)] = values[static_cast<size_t>(u)];
                timer++;
            }
        }

        /*
         * The prefix sums turn every chain segment into a single
         * subtraction, so a path query costs one step per chain instead of a
         * segment tree walk.
         */
        for (int i = 0; i < n_; i++) {
            prefix_[static_cast<size_t>(i) + 1] =
                prefix_[static_cast<size_t>(i)] + flat_[static_cast<size_t>(i)];
        }
    }

    // The number of vertices in the subtree of v.
    int subtreeSize(int v) const {
        if (v < 0 || v >= n_) {
            return 0;
        }
        return size_[static_cast<size_t>(v)];
    }

    // The child of v with the largest subtree, or -1 when v is a leaf.
    int heavyChild(int v) const {
        if (v < 0 || v >= n_) {
            return -1;
        }
        return heavy_[static_cast<size_t>(v)];
    }

    // The top of the chain of v.
    int chainHead(int v) const {
        if (v < 0 || v >= n_) {
            return -1;
        }
        return head_[static_cast<size_t>(v)];
    }

    // The index of v in the flattened array.
    int position(int v) const {
        if (v < 0 || v >= n_) {
            return -1;
        }
        return pos_[static_cast<size_t>(v)];
    }

    // The sum of the values of the vertices on the path from u to v.
    long long pathSum(int u, int v) const {
        if (u < 0 || u >= n_ || v < 0 || v >= n_) {
            return 0;
        }
        if (depth_[static_cast<size_t>(u)] < 0 || depth_[static_cast<size_t>(v)] < 0) {
            // A vertex outside the component of the root lies on no path.
            return 0;
        }

        long long total = 0;
        while (head_[static_cast<size_t>(u)] != head_[static_cast<size_t>(v)]) {
            if (depth_[static_cast<size_t>(head_[static_cast<size_t>(u)])] <
                depth_[static_cast<size_t>(head_[static_cast<size_t>(v)])]) {
                const int swap = u;
                u = v;
                v = swap;
            }
            // The chain of u is a contiguous range of the flattened array.
            const int top = head_[static_cast<size_t>(u)];
            total += prefix_[static_cast<size_t>(pos_[static_cast<size_t>(u)]) + 1] -
                     prefix_[static_cast<size_t>(pos_[static_cast<size_t>(top)])];
            u = parent_[static_cast<size_t>(top)];
        }
        if (depth_[static_cast<size_t>(u)] > depth_[static_cast<size_t>(v)]) {
            const int swap = u;
            u = v;
            v = swap;
        }
        total += prefix_[static_cast<size_t>(pos_[static_cast<size_t>(v)]) + 1] -
                 prefix_[static_cast<size_t>(pos_[static_cast<size_t>(u)])];
        return total;
    }

private:
    int n_;
    std::vector<int> parent_;
    std::vector<int> depth_;
    std::vector<int> size_;
    std::vector<int> heavy_;
    std::vector<int> head_;
    std::vector<int> pos_;
    std::vector<long long> flat_;
    std::vector<long long> prefix_;
};

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    // The tree 0-1, 1-2, 1-3 with the value of the vertex i equal to i + 1.
    const std::vector<std::vector<int>> adj = {
        {1},
        {0, 2, 3},
        {1},
        {1},
    };
    const std::vector<long long> values = {1, 2, 3, 4};
    const Hld hld(adj, 0, values);

    if (hld.subtreeSize(0) != 4 || hld.subtreeSize(1) != 3 ||
        hld.subtreeSize(2) != 1 || hld.subtreeSize(3) != 1) {
        return 1;
    }
    if (hld.heavyChild(0) != 1 || hld.heavyChild(1) != 2) {
        return 1;
    }

    if (hld.pathSum(2, 3) != 9) {
        return 1;
    }
    if (hld.pathSum(0, 3) != 7) {
        return 1;
    }
    // The path of a vertex with itself holds that vertex alone.
    if (hld.pathSum(0, 0) != 1) {
        return 1;
    }
    if (hld.pathSum(1, 1) != 2) {
        return 1;
    }

    return 0;
}
