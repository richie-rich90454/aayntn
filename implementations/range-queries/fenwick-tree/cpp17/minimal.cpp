#include <vector>

/**
 * A Fenwick tree (binary indexed tree) over a 1-indexed array: tree[i] holds
 * the sum of the positions in the block (i - lowbit(i), i], where lowbit(i) is
 * the largest power of two that divides i.
 *
 * The vector owns the storage, so the constructor allocates it and the
 * destructor releases it without any explicit destroy call.
 */
class Fenwick {
public:
    explicit Fenwick(int n) : n_(n), tree_(static_cast<size_t>(n) + 1, 0) {
    }

    // Adds delta to the value at the 1-based index.
    void add(int index, long long delta) {
        if (index < 1) {
            return;
        }
        // Stepping up by lowbit visits exactly the blocks that contain the index.
        for (int i = index; i <= n_; i += i & (-i)) {
            tree_[static_cast<size_t>(i)] += delta;
        }
    }

    // The sum of the positions 1..index.
    long long prefixSum(int index) const {
        if (index > n_) {
            index = n_;
        }
        long long total = 0;
        // Stepping down by lowbit visits disjoint blocks that partition 1..index.
        for (int i = index; i > 0; i -= i & (-i)) {
            total += tree_[static_cast<size_t>(i)];
        }
        return total;
    }

    // The sum of the positions left..right, both inclusive.
    long long rangeSum(int left, int right) const {
        return prefixSum(right) - prefixSum(left - 1);
    }

private:
    int n_;
    std::vector<long long> tree_;
};

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    Fenwick tree(5);

    tree.add(1, 5);
    tree.add(2, 3);
    if (tree.prefixSum(2) != 8) {
        return 1;
    }
    if (tree.rangeSum(1, 2) != 8) {
        return 1;
    }
    if (tree.rangeSum(1, 5) != 8) {
        return 1;
    }
    if (tree.rangeSum(3, 5) != 0) {
        return 1;
    }

    // A negative delta removes value, and the empty prefix sums to zero.
    tree.add(2, -3);
    if (tree.rangeSum(1, 5) != 5) {
        return 1;
    }
    if (tree.prefixSum(0) != 0) {
        return 1;
    }

    return 0;
}
