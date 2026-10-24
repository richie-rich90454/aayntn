import java.io.IOException;
import java.io.InputStream;

/**
 * Nearest-site queries on a static set of points.
 *
 * <p>The program answers the defining query directly and does not build the
 * full Voronoi diagram. Input: n and q, then n points, then q query points.
 * Output: for each query, the 1-based index of the nearest point by squared
 * Euclidean distance, with ties broken by the lowest index.
 */
public final class Main {

    private Main() {
    }

    private static long squaredDistance(long x1, long y1, long x2, long y2) {
        final long dx = x1 - x2;
        final long dy = y1 - y2;
        return dx * dx + dy * dy;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        final int q = (int) fs.nextLong();
        if (n <= 0) {
            return;
        }

        final long[] xs = new long[n];
        final long[] ys = new long[n];
        for (int i = 0; i < n; i++) {
            xs[i] = fs.nextLong();
            ys[i] = fs.nextLong();
        }

        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final long qx = fs.nextLong();
            final long qy = fs.nextLong();
            long best = 0;
            int bestIndex = -1;
            for (int i = 0; i < n; i++) {
                final long d = squaredDistance(xs[i], ys[i], qx, qy);
                if (bestIndex < 0 || d < best || (d == best && i < bestIndex)) {
                    best = d;
                    bestIndex = i;
                }
            }
            out.append(bestIndex + 1).append('\n');
        }
        System.out.print(out);
    }

    /** Token scanner over standard input. */
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
