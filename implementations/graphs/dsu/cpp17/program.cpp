#include <iostream>
#include <utility>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/**
 * A disjoint set over the elements 0..n-1: parent holds the representative of
 * every element and size holds the number of elements of the set it
 * represents.
 *
 * The vector owns the storage, so the constructor allocates it and the
 * destructor releases it without any explicit destroy call.
 */
class DisjointSet {
public:
    explicit DisjointSet(int n)
        : parent_(static_cast<size_t>(n > 0 ? n : 0)),
          size_(static_cast<size_t>(n > 0 ? n : 0), 1) {
        for (size_t i = 0; i < parent_.size(); ++i) {
            parent_[i] = static_cast<int>(i);
        }
    }

    // The representative of the set holding x, compressing the path to it.
    int find(int x) {
        int root = x;
        while (parent_[static_cast<size_t>(root)] != root) {
            root = parent_[static_cast<size_t>(root)];
        }
        // Every element on the path now points at the root.
        while (parent_[static_cast<size_t>(x)] != x) {
            const int next = parent_[static_cast<size_t>(x)];
            parent_[static_cast<size_t>(x)] = root;
            x = next;
        }
        return root;
    }

    // Merges the sets holding a and b.
    void unite(int a, int b) {
        int root_a = find(a);
        int root_b = find(b);
        if (root_a == root_b) {
            return;
        }
        // The larger set absorbs the smaller one, which keeps the trees shallow.
        if (size_[static_cast<size_t>(root_a)] < size_[static_cast<size_t>(root_b)]) {
            std::swap(root_a, root_b);
        }
        parent_[static_cast<size_t>(root_b)] = root_a;
        size_[static_cast<size_t>(root_a)] += size_[static_cast<size_t>(root_b)];
    }

    // Whether a and b belong to the same set.
    bool same(int a, int b) {
        return find(a) == find(b);
    }

private:
    std::vector<int> parent_;
    std::vector<int> size_;
};

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
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    if (q < 0) {
        q = 0;
    }

    DisjointSet set(n);

    for (int i = 0; i < q; ++i) {
        int type = 0;
        int u = 0;
        int v = 0;
        if (!(std::cin >> type >> u >> v)) {
            break;
        }
        const bool valid = u >= 0 && u < n && v >= 0 && v < n;
        if (type == 1) {
            if (valid) {
                set.unite(u, v);
            }
        } else if (type == 2) {
            std::cout << (valid && set.same(u, v) ? "yes\n" : "no\n");
        }
    }
    return 0;
}
