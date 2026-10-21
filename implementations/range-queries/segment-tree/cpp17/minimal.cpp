#include <vector>

/**
 * A segment tree over a 1-indexed array of n values: tree_[node] holds the
 * sum of the values of the range that the node covers, so every node caches
 * the result of merging its two children.
 *
 * The vector owns the storage, so the constructor allocates it and the
 * destructor releases it without any explicit destroy call.
 */
class SegmentTree {
public:
    /**
     * @param values the values of the positions 1..n, so values[0] holds the
     *   value of the position 1
     */
    explicit SegmentTree(const std::vector<long long>& values)
        : n_(static_cast<int>(values.size())),
          tree_(static_cast<size_t>(4 * n_) + 4, 0) {
        if (n_ > 0) {
            build(1, 1, n_, values);
        }
    }

    // Assigns the value at the 1-based index; an index outside 1..n is ignored.
    void set(int index, long long value) {
        if (index < 1 || index > n_) {
            return;
        }
        assign(1, 1, n_, index, value);
    }

    // The sum of the positions left..right, both inclusive.
    long long rangeSum(int left, int right) const {
        if (left < 1) {
            left = 1;
        }
        if (right > n_) {
            right = n_;
        }
        if (left > right) {
            return 0;
        }
        return query(1, 1, n_, left, right);
    }

private:
    int n_;
    std::vector<long long> tree_;

    // Fills the subtree of node, which covers the positions lo..hi.
    void build(int node, int lo, int hi, const std::vector<long long>& values) {
        if (lo == hi) {
            tree_[static_cast<size_t>(node)] = values[static_cast<size_t>(lo - 1)];
            return;
        }
        const int mid = lo + (hi - lo) / 2;
        build(node * 2, lo, mid, values);
        build(node * 2 + 1, mid + 1, hi, values);
        tree_[static_cast<size_t>(node)] = tree_[static_cast<size_t>(node * 2)] +
                                           tree_[static_cast<size_t>(node * 2 + 1)];
    }

    // Assigns the value at the 1-based index inside the subtree of node.
    void assign(int node, int lo, int hi, int index, long long value) {
        if (lo == hi) {
            tree_[static_cast<size_t>(node)] = value;
            return;
        }
        const int mid = lo + (hi - lo) / 2;
        if (index <= mid) {
            assign(node * 2, lo, mid, index, value);
        } else {
            assign(node * 2 + 1, mid + 1, hi, index, value);
        }
        // Merging the two children restores the invariant of the node.
        tree_[static_cast<size_t>(node)] = tree_[static_cast<size_t>(node * 2)] +
                                           tree_[static_cast<size_t>(node * 2 + 1)];
    }

    // The sum of the positions left..right inside the subtree of node.
    long long query(int node, int lo, int hi, int left, int right) const {
        if (right < lo || hi < left) {
            // The queried range and the subtree do not overlap.
            return 0;
        }
        if (left <= lo && hi <= right) {
            return tree_[static_cast<size_t>(node)];
        }
        const int mid = lo + (hi - lo) / 2;
        return query(node * 2, lo, mid, left, right) +
               query(node * 2 + 1, mid + 1, hi, left, right);
    }
};

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    const std::vector<long long> values = {1, 2, 3, 4, 5};
    SegmentTree tree(values);

    if (tree.rangeSum(1, 5) != 15) {
        return 1;
    }
    if (tree.rangeSum(2, 4) != 9) {
        return 1;
    }
    if (tree.rangeSum(3, 3) != 3) {
        return 1;
    }

    tree.set(3, 30);
    if (tree.rangeSum(1, 5) != 42) {
        return 1;
    }
    if (tree.rangeSum(3, 5) != 39) {
        return 1;
    }

    // A negative value is an ordinary value, and an empty range sums to 0.
    tree.set(1, -10);
    if (tree.rangeSum(1, 5) != 31) {
        return 1;
    }
    if (tree.rangeSum(4, 2) != 0) {
        return 1;
    }

    // An index outside the array is ignored.
    tree.set(9, 100);
    tree.set(0, 100);
    if (tree.rangeSum(1, 5) != 31) {
        return 1;
    }

    return 0;
}
