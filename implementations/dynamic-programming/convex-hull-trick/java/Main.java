import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * The smallest value of a set of lines, read from standard input.
 *
 * <p>Input: n q, then n lines m b that add the line y = m * x + b, then q
 * lines x that query the smallest value of the lines added so far.
 * <p>Output: one line per query, holding the smallest value.
 */
public final class Main {

    private Main() {
    }

    /**
     * A monotone convex hull trick over the lines y = m * x + b: the lines are
     * added with a non-decreasing slope, the queries arrive with a
     * non-decreasing x, and the answer is the smallest value of the lines added
     * so far.
     *
     * The hull is a stack of lines with increasing slopes. The line on top of
     * the stack is the one that is smallest for the smallest x, and a query
     * walks down the stack as the x grows.
     *
     * The arrays belong to the Java heap, so the garbage collector reclaims
     * them and no explicit destroy call is needed.
     */
    private static final class ConvexHull {
        private long[] slope;
        private long[] intercept;
        private int size;

        ConvexHull(int capacity) {
            this.slope = new long[Math.max(capacity, 1)];
            this.intercept = new long[Math.max(capacity, 1)];
            this.size = 0;
        }

        /**
         * Adds the line y = m * x + b. The slope must not be smaller than the
         * slope of the line added before, which is what makes the amortised
         * cost of the operations constant.
         */
        void add(long m, long b) {
            while (size > 0 && slope[size - 1] == m) {
                if (intercept[size - 1] <= b) {
                    // The new line is never the smallest, so it is dropped.
                    return;
                }
                // The new line wins against the line with the same slope.
                size--;
            }
            while (size >= 2 &&
                   redundant(slope[size - 2], intercept[size - 2],
                             slope[size - 1], intercept[size - 1], m, b)) {
                // The line on top of the stack is never the smallest.
                size--;
            }
            if (size == slope.length) {
                slope = Arrays.copyOf(slope, size * 2);
                intercept = Arrays.copyOf(intercept, size * 2);
            }
            slope[size] = m;
            intercept[size] = b;
            size++;
        }

        /**
         * The smallest value of the lines added so far at the point x. The x
         * values must not decrease, which is what lets the query drop the lines
         * it walks past. The answer of a query with no line at all is 0.
         */
        long query(long x) {
            if (size == 0) {
                return 0L;
            }
            while (size >= 2) {
                final long top = slope[size - 1] * x + intercept[size - 1];
                final long below = slope[size - 2] * x + intercept[size - 2];
                if (below >= top) {
                    break;
                }
                /*
                 * The line on top of the stack has the larger slope, so it
                 * stays the worse of the two for every larger x and is dropped
                 * for good.
                 */
                size--;
            }
            return slope[size - 1] * x + intercept[size - 1];
        }

        /**
         * True when the middle line of the three never holds the minimum: the
         * switch points of the neighbors have to decrease along the stack,
         * and the comparison is done on the switch points, so the products of
         * the coefficients never enter the arithmetic.
         */
        private static boolean redundant(long m1, long b1, long m2, long b2,
                                         long m3, long b3) {
            return (double) (b1 - b2) / (double) (m2 - m1) <=
                   (double) (b2 - b3) / (double) (m3 - m2);
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long qToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || qToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        final int q = (int) qToken;

        final ConvexHull hull = new ConvexHull(n);

        for (int i = 0; i < n; i++) {
            final long m = fs.nextLong();
            final long b = fs.nextLong();
            if (m == Long.MIN_VALUE || b == Long.MIN_VALUE) {
                break;
            }
            hull.add(m, b);
        }

        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final long x = fs.nextLong();
            if (x == Long.MIN_VALUE) {
                break;
            }
            out.append(hull.query(x)).append('\n');
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
