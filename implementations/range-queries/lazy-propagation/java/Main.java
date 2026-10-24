import java.io.IOException;
import java.io.InputStream;

/**
 * A lazy segment tree over a 1-indexed array of n positions, supporting range
 * addition and range sum queries.
 *
 * <p>tree[i] holds the sum of the node's range, and lazy[i] holds the addition
 * that has already been applied to tree[i] but not yet to its children.
 */
public final class Main {

    private static int n;
    private static long[] tree;
    private static long[] lazy;

    private Main() {
    }

    private static void apply(int node, int lo, int hi, long delta) {
        tree[node] += delta * (long) (hi - lo + 1);
        lazy[node] += delta;
    }

    private static void push(int node, int lo, int hi) {
        if (lazy[node] == 0 || lo == hi) {
            return;
        }
        final int mid = lo + (hi - lo) / 2;
        apply(node * 2, lo, mid, lazy[node]);
        apply(node * 2 + 1, mid + 1, hi, lazy[node]);
        lazy[node] = 0;
    }

    private static void rangeAdd(int node, int lo, int hi, int left, int right, long delta) {
        if (right < lo || hi < left) {
            return;
        }
        if (left <= lo && hi <= right) {
            apply(node, lo, hi, delta);
            return;
        }
        push(node, lo, hi);
        final int mid = lo + (hi - lo) / 2;
        rangeAdd(node * 2, lo, mid, left, right, delta);
        rangeAdd(node * 2 + 1, mid + 1, hi, left, right, delta);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }

    private static long rangeSum(int node, int lo, int hi, int left, int right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return tree[node];
        }
        push(node, lo, hi);
        final int mid = lo + (hi - lo) / 2;
        return rangeSum(node * 2, lo, mid, left, right)
                + rangeSum(node * 2 + 1, mid + 1, hi, left, right);
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        n = Math.max(0, (int) fs.nextLong());
        final int q = (int) fs.nextLong();

        tree = new long[4 * n + 4];
        lazy = new long[4 * n + 4];

        for (int k = 0; k < q; k++) {
            final int kind = (int) fs.nextLong();
            if (kind == 1) {
                final int left = (int) fs.nextLong();
                final int right = (int) fs.nextLong();
                final long delta = fs.nextLong();
                if (n > 0) {
                    rangeAdd(1, 1, n, left, right, delta);
                }
            } else if (kind == 2) {
                final int left = (int) fs.nextLong();
                final int right = (int) fs.nextLong();
                if (n > 0) {
                    System.out.println(rangeSum(1, 1, n, left, right));
                } else {
                    System.out.println(0);
                }
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
