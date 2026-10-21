import java.io.IOException;
import java.io.InputStream;

/**
 * A Fenwick tree (binary indexed tree) over a 1-indexed array, driven from
 * standard input.
 *
 * <p>Input: n q, then q operations. "1 i delta" adds delta to the value at the
 * 1-based index i, and "2 l r" queries the sum over the inclusive range
 * [l, r].
 * Output: one line per query, holding the range sum.
 */
public final class Main {

    private Main() {
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

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        final int q = (int) fs.nextLong();

        final Fenwick tree = new Fenwick(Math.max(0, n));

        for (int k = 0; k < q; k++) {
            final int kind = (int) fs.nextLong();
            if (kind == 1) {
                final int index = (int) fs.nextLong();
                final long delta = fs.nextLong();
                tree.add(index, delta);
            } else if (kind == 2) {
                final int left = (int) fs.nextLong();
                final int right = (int) fs.nextLong();
                System.out.println(tree.rangeSum(left, right));
            } else {
                break;
            }
        }
    }

    /**
     * Token scanner over standard input: contest inputs are far too large for
     * java.util.Scanner.
     */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer == available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
