/**
 * A segment tree over a 1-indexed array of n values: tree[node] holds the sum
 * of the values of the range that the node covers, so every node caches the
 * result of merging its two children.
 */
public final class Program {

    private Program() {
    }

    /**
     * The array belongs to the Java heap, so the garbage collector reclaims
     * it and no explicit destroy call is needed.
     */
    public static final class SegmentTree {
        private final int n;
        private final long[] tree;

        /**
         * @param values the values of the positions 1..n, so values[0] holds
         *   the value of the position 1
         */
        public SegmentTree(long[] values) {
            this.n = values.length;
            this.tree = new long[4 * n + 4];
            if (n > 0) {
                build(1, 1, n, values);
            }
        }

        /**
         * Assigns the value at the 1-based index; an index outside 1..n is
         * ignored.
         */
        public void set(int index, long value) {
            if (index < 1 || index > n) {
                return;
            }
            assign(1, 1, n, index, value);
        }

        /**
         * The sum of the positions left..right, both inclusive.
         */
        public long rangeSum(int left, int right) {
            if (left < 1) {
                left = 1;
            }
            if (right > n) {
                right = n;
            }
            if (left > right) {
                return 0;
            }
            return query(1, 1, n, left, right);
        }

        // Fills the subtree of node, which covers the positions lo..hi.
        private void build(int node, int lo, int hi, long[] values) {
            if (lo == hi) {
                tree[node] = values[lo - 1];
                return;
            }
            final int mid = lo + (hi - lo) / 2;
            build(node * 2, lo, mid, values);
            build(node * 2 + 1, mid + 1, hi, values);
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        // Assigns the value at the 1-based index inside the subtree of node.
        private void assign(int node, int lo, int hi, int index, long value) {
            if (lo == hi) {
                tree[node] = value;
                return;
            }
            final int mid = lo + (hi - lo) / 2;
            if (index <= mid) {
                assign(node * 2, lo, mid, index, value);
            } else {
                assign(node * 2 + 1, mid + 1, hi, index, value);
            }
            // Merging the two children restores the invariant of the node.
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        // The sum of the positions left..right inside the subtree of node.
        private long query(int node, int lo, int hi, int left, int right) {
            if (right < lo || hi < left) {
                // The queried range and the subtree do not overlap.
                return 0;
            }
            if (left <= lo && hi <= right) {
                return tree[node];
            }
            final int mid = lo + (hi - lo) / 2;
            return query(node * 2, lo, mid, left, right) +
                   query(node * 2 + 1, mid + 1, hi, left, right);
        }
    }

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final SegmentTree tree = new SegmentTree(new long[] {1, 2, 3, 4, 5});

        if (tree.rangeSum(1, 5) != 15L) {
            throw new IllegalStateException("segment tree contract broken");
        }
        if (tree.rangeSum(2, 4) != 9L) {
            throw new IllegalStateException("segment tree contract broken");
        }
        if (tree.rangeSum(3, 3) != 3L) {
            throw new IllegalStateException("segment tree contract broken");
        }

        tree.set(3, 30L);
        if (tree.rangeSum(1, 5) != 42L) {
            throw new IllegalStateException("segment tree contract broken");
        }
        if (tree.rangeSum(3, 5) != 39L) {
            throw new IllegalStateException("segment tree contract broken");
        }

        // A negative value is an ordinary value, and an empty range sums to 0.
        tree.set(1, -10L);
        if (tree.rangeSum(1, 5) != 31L) {
            throw new IllegalStateException("segment tree contract broken");
        }
        if (tree.rangeSum(4, 2) != 0L) {
            throw new IllegalStateException("segment tree contract broken");
        }

        // An index outside the array is ignored.
        tree.set(9, 100L);
        tree.set(0, 100L);
        if (tree.rangeSum(1, 5) != 31L) {
            throw new IllegalStateException("segment tree contract broken");
        }
    }
}
