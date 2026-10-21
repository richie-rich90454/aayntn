/**
 * A Fenwick tree (binary indexed tree) over a 1-indexed array.
 */
public final class Program {

    private Program() {
    }

    /**
     * A Fenwick tree over a 1-indexed array: tree[i] holds the sum of the
     * positions in the block (i - lowbit(i), i], where lowbit(i) is the largest
     * power of two that divides i.
     */
    public static final class Fenwick {
        private final int n;
        private final long[] tree;

        public Fenwick(int n) {
            this.n = n;
            this.tree = new long[n + 1];
        }

        /**
         * Adds delta to the value at the 1-based index.
         */
        public void add(int index, long delta) {
            if (index < 1) {
                return;
            }
            // Stepping up by lowbit visits exactly the blocks that contain the index.
            for (int i = index; i <= n; i += i & (-i)) {
                tree[i] += delta;
            }
        }

        /**
         * The sum of the positions 1..index.
         */
        public long prefixSum(int index) {
            if (index > n) {
                index = n;
            }
            long total = 0;
            // Stepping down by lowbit visits disjoint blocks that partition 1..index.
            for (int i = index; i > 0; i -= i & (-i)) {
                total += tree[i];
            }
            return total;
        }

        /**
         * The sum of the positions left..right, both inclusive.
         */
        public long rangeSum(int left, int right) {
            return prefixSum(right) - prefixSum(left - 1);
        }
    }

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final Fenwick tree = new Fenwick(5);

        tree.add(1, 5);
        tree.add(2, 3);
        if (tree.prefixSum(2) != 8L) {
            throw new IllegalStateException("fenwick contract broken");
        }
        if (tree.rangeSum(1, 2) != 8L) {
            throw new IllegalStateException("fenwick contract broken");
        }
        if (tree.rangeSum(1, 5) != 8L) {
            throw new IllegalStateException("fenwick contract broken");
        }
        if (tree.rangeSum(3, 5) != 0L) {
            throw new IllegalStateException("fenwick contract broken");
        }

        // A negative delta removes value, and the empty prefix sums to zero.
        tree.add(2, -3);
        if (tree.rangeSum(1, 5) != 5L) {
            throw new IllegalStateException("fenwick contract broken");
        }
        if (tree.prefixSum(0) != 0L) {
            throw new IllegalStateException("fenwick contract broken");
        }
    }
}
