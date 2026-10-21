#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

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
    if (n < 0) {
        n = 0;
    }
    if (q < 0) {
        q = 0;
    }

    // Every position starts at zero, because the input carries no values.
    SegmentTree tree(std::vector<long long>(static_cast<size_t>(n), 0));

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (!(std::cin >> kind)) {
            break;
        }
        if (kind == 1) {
            int index = 0;
            long long value = 0;
            if (!(std::cin >> index >> value)) {
                break;
            }
            tree.set(index, value);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (!(std::cin >> left >> right)) {
                break;
            }
            std::cout << tree.rangeSum(left, right) << '\n';
        } else {
            break;
        }
    }

    return 0;
}
