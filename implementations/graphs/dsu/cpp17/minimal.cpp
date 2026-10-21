#include <iostream>
#include <utility>
#include <vector>

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

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    DisjointSet set(5);

    set.unite(0, 1);
    set.unite(2, 3);
    if (!set.same(0, 1)) {
        return 1;
    }
    if (set.same(0, 2)) {
        return 1;
    }
    if (set.same(0, 3)) {
        return 1;
    }
    if (set.find(0) != set.find(1)) {
        return 1;
    }
    if (set.find(0) == set.find(2)) {
        return 1;
    }

    set.unite(1, 3);
    if (!set.same(0, 3)) {
        return 1;
    }
    if (!set.same(2, 3)) {
        return 1;
    }
    if (set.same(0, 4)) {
        return 1;
    }

    return 0;
}
