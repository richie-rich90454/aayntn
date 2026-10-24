import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Floyd-Warshall over a directed weighted graph read from standard input.
 *
 * <p>Input: n m, then m lines u v w (0-based, directed, integer weight). The
 * input ends after the edges.
 * Output: n lines of n integers, where the j-th number of the i-th line is the
 * shortest distance from i to j, and -1 when j is unreachable from i. A graph
 * with a negative cycle prints the single line {@code negative cycle} instead.
 */
public final class Main {

    /*
     * Larger than any shortest path this program can build from two finite
     * values, so the guarded addition below cannot overflow a 64-bit integer.
     */
    private static final long INFINITY = 4_000_000_000_000_000_000L;

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        int m = (int) mToken;
        if (n <= 0) {
            System.out.print("\n");
            return;
        }
        if (m < 0) {
            m = 0;
        }

        final long[] distance = new long[n * n];
        Arrays.fill(distance, INFINITY);
        for (int v = 0; v < n; v++) {
            distance[v * n + v] = 0L;
        }

        for (int e = 0; e < m; e++) {
            final int u = (int) fs.nextLong();
            final int v = (int) fs.nextLong();
            final long w = fs.nextLong();
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            final int at = u * n + v;
            if (w < distance[at]) {
                // Parallel edges are allowed, and only the cheaper one matters.
                distance[at] = w;
            }
        }

        for (int k = 0; k < n; k++) {
            final int rowK = k * n;
            for (int i = 0; i < n; i++) {
                final int rowI = i * n;
                final long through = distance[rowI + k];
                if (through == INFINITY) {
                    continue;
                }
                for (int j = 0; j < n; j++) {
                    final long rest = distance[rowK + j];
                    if (rest == INFINITY) {
                        continue;
                    }
                    final long candidate = through + rest;
                    if (candidate < distance[rowI + j]) {
                        distance[rowI + j] = candidate;
                    }
                }
            }
        }

        for (int v = 0; v < n; v++) {
            if (distance[v * n + v] < 0L) {
                System.out.print("negative cycle\n");
                return;
            }
        }

        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (j > 0) {
                    out.append(' ');
                }
                final long value = distance[i * n + j];
                out.append(value == INFINITY ? -1L : value);
            }
            out.append('\n');
        }
        System.out.print(out);
    }

    /**
     * Token scanner over standard input: the matrix output is quadratic, so the
     * input side must not be the bottleneck.
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
