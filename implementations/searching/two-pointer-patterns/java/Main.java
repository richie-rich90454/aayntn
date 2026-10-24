import java.io.IOException;
import java.io.InputStream;

/**
 * Two-pointer pair count driver.
 *
 * <p>Reads n, then n integers in non-decreasing order, then the target. Prints
 * the number of index pairs i &lt; j whose sum is at most the target.
 */
public final class Main {

    private Main() {
    }

    public static void main(final String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);

        if (!scanner.next()) {
            System.out.println(0);
            return;
        }

        final long declared = scanner.value();

        if (declared < 0 || declared > Integer.MAX_VALUE) {
            System.out.println(0);
            return;
        }

        final int n = (int) declared;
        final long[] values = new long[n];

        for (int i = 0; i < n; ++i) {
            if (!scanner.next()) {
                System.out.println(0);
                return;
            }
            values[i] = scanner.value();
        }

        if (!scanner.next()) {
            System.out.println(0);
            return;
        }

        final long target = scanner.value();
        System.out.println(countPairs(values, target));
    }

    private static long countPairs(final long[] values, final long target) {
        long total = 0;
        int left = 0;
        int right = values.length - 1;

        while (left < right) {
            if (values[left] + values[right] <= target) {
                total += right - left;
                ++left;
            } else {
                --right;
            }
        }
        return total;
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
