import java.io.IOException;
import java.io.InputStream;

/**
 * Sorted range search driver.
 *
 * <p>Reads n, then n disjoint intervals sorted by left endpoint, then one point.
 * Prints the 0-based index of the interval that contains the point, or -1 when
 * no interval contains it.
 */
public final class Main {

    private Main() {
    }

    public static void main(final String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);

        if (!scanner.next()) {
            System.out.println(-1);
            return;
        }

        final long declared = scanner.value();

        if (declared < 0 || declared > Integer.MAX_VALUE) {
            System.out.println(-1);
            return;
        }

        final int n = (int) declared;
        final long[] left = new long[n];
        final long[] right = new long[n];

        for (int i = 0; i < n; ++i) {
            if (!scanner.next()) {
                System.out.println(-1);
                return;
            }
            left[i] = scanner.value();

            if (!scanner.next()) {
                System.out.println(-1);
                return;
            }
            right[i] = scanner.value();
        }

        if (!scanner.next()) {
            System.out.println(-1);
            return;
        }

        final long point = scanner.value();
        System.out.println(locate(left, right, point));
    }

    private static int locate(final long[] left, final long[] right, final long point) {
        int lo = 0;
        int hi = left.length - 1;

        while (lo <= hi) {
            final int mid = lo + (hi - lo) / 2;
            if (point < left[mid]) {
                hi = mid - 1;
            } else if (point > right[mid]) {
                lo = mid + 1;
            } else {
                return mid;
            }
        }
        return -1;
    }

    /** Buffered integer reader for contest input. */
    private static final class FastScanner {

        private final InputStream in;
        private final byte[] buffer = new byte[1 << 16];
        private int position;
        private int limit;
        private long value;

        FastScanner(final InputStream in) {
            this.in = in;
        }

        /** Reads the next integer; false once the input is exhausted. */
        boolean next() throws IOException {
            int c = read();
            while (c != -1 && c <= ' ') {
                c = read();
            }
            if (c == -1) {
                return false;
            }

            boolean negative = false;
            if (c == '-') {
                negative = true;
                c = read();
            }

            long parsed = 0;
            while (c >= '0' && c <= '9') {
                parsed = parsed * 10 + (c - '0');
                c = read();
            }

            value = negative ? -parsed : parsed;
            return true;
        }

        /** The integer read by the last successful {@link #next()} call. */
        long value() {
            return value;
        }

        private int read() throws IOException {
            if (position >= limit) {
                limit = in.read(buffer);
                position = 0;
                if (limit <= 0) {
                    limit = 0;
                    return -1;
                }
            }
            return buffer[position++] & 0xff;
        }
    }
}
