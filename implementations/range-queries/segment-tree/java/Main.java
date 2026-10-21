import java.io.IOException;
import java.io.InputStream;

/**
 * A segment tree over a 1-indexed array of n values, driven from standard
 * input.
 *
 * <p>Input: n q, then q operations. "1 i v" assigns the value v to the
 * 1-based position i, and "2 l r" queries the sum over the inclusive range
 * [l, r].
 * <p>Output: one line per query, holding the range sum.
 */
public final class Main {

    private Main() {
    }

    /**
     * The array belongs to the Java heap, so the garbage collector reclaims
     * it and no explicit destroy call is needed.
     */
    private static final class SegmentTree {
        private final int n;
        private final long[] tree;

        /**
         * @param values the values of the positions 1..n, so values[0] holds
         *   the value of the position 1
         */
        SegmentTree(long[] values) {
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
        void set(int index, long value) {
            if (index < 1 || index > n) {
                return;
            }
            assign(1, 1, n, index, value);
        }

        /**
         * The sum of the positions left..right, both inclusive.
         */
        long rangeSum(int left, int right) {
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

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long qToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || qToken == Long.MIN_VALUE) {
            return;
        }
        int n = (int) nToken;
        final int q = (int) qToken;
        if (n < 0) {
            n = 0;
        }

        // Every position starts at zero, because the input carries no values.
        final SegmentTree tree = new SegmentTree(new long[n]);

        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final long kindToken = fs.nextLong();
            if (kindToken == Long.MIN_VALUE) {
                break;
            }
            final int kind = (int) kindToken;
            if (kind == 1) {
                final long indexToken = fs.nextLong();
                final long valueToken = fs.nextLong();
                if (indexToken == Long.MIN_VALUE || valueToken == Long.MIN_VALUE) {
                    break;
                }
                tree.set((int) indexToken, valueToken);
            } else if (kind == 2) {
                final long leftToken = fs.nextLong();
                final long rightToken = fs.nextLong();
                if (leftToken == Long.MIN_VALUE || rightToken == Long.MIN_VALUE) {
                    break;
                }
                out.append(tree.rangeSum((int) leftToken, (int) rightToken)).append('\n');
            } else {
                break;
            }
        }
        // An explicit newline keeps the output identical on every platform.
        System.out.print(out.toString());
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
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    // Keep the buffer empty, so the next call reads again and
                    // reports the end of the input again.
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        /**
         * The next token as a number, or Long.MIN_VALUE when the input holds
         * no more tokens.
         */
        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return Long.MIN_VALUE;
            }
            boolean negative = false;
            if (c == '-') {
                negative = true;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return negative ? -value : value;
        }
    }
}
