import java.io.IOException;
import java.io.InputStream;

/**
 * Segment tree beats over a 1-indexed array of n positions, supporting range
 * chmin and range sum queries.
 *
 * <p>Every node stores its sum, its largest value, the second largest distinct
 * value, and how many positions hold the largest value. A chmin that lands
 * strictly between the two largest values changes only the largest group, so
 * the node can absorb it in constant time; anything deeper has to descend.
 *
 * <p>Input: n q, then the n values, then q lines "1 l r x" (cap every position
 * in [l, r] at x) or "2 l r" (print the sum over [l, r]). Output: one line per
 * query.
 */
public final class Main {

    private static int n;
    private static long[] sum;
    private static long[] max1;
    private static long[] max2;
    private static int[] count;

    private static final long NONE = Long.MIN_VALUE;

    private Main() {
    }

    private static long max64(long a, long b) {
        return a > b ? a : b;
    }

    private static void pull(int node) {
        final int left = node * 2;
        final int right = left + 1;
        sum[node] = sum[left] + sum[right];
        if (max1[left] == max1[right]) {
            max1[node] = max1[left];
            count[node] = count[left] + count[right];
            max2[node] = max64(max2[left], max2[right]);
        } else if (max1[left] > max1[right]) {
            max1[node] = max1[left];
            count[node] = count[left];
            max2[node] = max64(max2[left], max1[right]);
        } else {
            max1[node] = max1[right];
            count[node] = count[right];
            max2[node] = max64(max1[left], max2[right]);
        }
    }

    /**
     * Caps the node's maximum at x. The caller guarantees max2 &lt; x &lt; max1,
     * so exactly the positions holding the maximum change.
     */
    private static void applyCap(int node, long x) {
        if (max1[node] <= x) {
            return;
        }
        sum[node] -= (max1[node] - x) * count[node];
        max1[node] = x;
    }

    /**
     * Passes a cap that is already included in the node's aggregates down to
     * its two children. The child's second maximum is at most the parent's
     * second maximum, which the stored cap exceeded, so the child absorbs it
     * in constant time.
     */
    private static void push(int node) {
        applyCap(node * 2, max1[node]);
        applyCap(node * 2 + 1, max1[node]);
    }

    private static void build(int node, int lo, int hi, long[] values) {
        if (lo == hi) {
            sum[node] = values[lo];
            max1[node] = values[lo];
            max2[node] = NONE;
            count[node] = 1;
            return;
        }
        final int mid = lo + (hi - lo) / 2;
        build(node * 2, lo, mid, values);
        build(node * 2 + 1, mid + 1, hi, values);
        pull(node);
    }

    private static void chmin(int node, int lo, int hi, int left, int right, long x) {
        if (right < lo || hi < left || max1[node] <= x) {
            return;
        }
        if (left <= lo && hi <= right && max2[node] < x) {
            applyCap(node, x);
            return;
        }
        if (lo == hi) {
            applyCap(node, x);
            return;
        }
        push(node);
        final int mid = lo + (hi - lo) / 2;
        chmin(node * 2, lo, mid, left, right, x);
        chmin(node * 2 + 1, mid + 1, hi, left, right, x);
        pull(node);
    }

    private static long rangeSum(int node, int lo, int hi, int left, int right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return sum[node];
        }
        push(node);
        final int mid = lo + (hi - lo) / 2;
        return rangeSum(node * 2, lo, mid, left, right)
                + rangeSum(node * 2 + 1, mid + 1, hi, left, right);
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);
        n = scanner.nextInt();
        final int q = scanner.nextInt();
        if (n <= 0) {
            return;
        }

        final long[] values = new long[n + 1];
        for (int i = 1; i <= n; ++i) {
            values[i] = scanner.nextLong();
        }

        final int size = 4 * n + 4;
        sum = new long[size];
        max1 = new long[size];
        max2 = new long[size];
        count = new int[size];
        build(1, 1, n, values);

        for (int k = 0; k < q; ++k) {
            final int kind = scanner.nextInt();
            if (kind == 1) {
                final int left = scanner.nextInt();
                final int right = scanner.nextInt();
                final long x = scanner.nextLong();
                chmin(1, 1, n, left, right, x);
            } else if (kind == 2) {
                final int left = scanner.nextInt();
                final int right = scanner.nextInt();
                System.out.println(rangeSum(1, 1, n, left, right));
            } else {
                break;
            }
        }
    }

    /**
     * Reads signed integers from standard input without splitting the whole
     * stream into strings.
     */
    private static final class FastScanner {
        private final InputStream in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private FastScanner(InputStream in) {
            this.in = in;
        }

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

        int nextInt() throws IOException {
            return (int) nextLong();
        }
    }
}
