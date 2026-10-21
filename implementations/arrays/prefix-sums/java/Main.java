import java.io.IOException;
import java.io.InputStream;

/**
 * Prefix sums driver.
 *
 * <p>Reads n, the n array values, q and then q 1-based inclusive ranges
 * from standard input, and prints one range sum per line.
 */
public final class Main {

    private Main() {
    }

    /**
     * Fills prefix[0 .. n] with the running totals of a[0 .. n-1].
     *
     * @param a      the values
     * @param n      number of values
     * @param prefix receives n+1 sums; the caller owns the array
     */
    private static void prefixSums(final long[] a, final int n, final long[] prefix) {
        prefix[0] = 0L;
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + a[i];
        }
    }

    public static void main(final String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);

        if (!scanner.next()) {
            return;
        }
        int n = (int) Math.min(scanner.value(), Integer.MAX_VALUE);
        if (n < 0) {
            n = 0;
        }

        /* The values start at zero, so a truncated input leaves zeros behind. */
        final long[] a = new long[n];
        for (int i = 0; i < n; i++) {
            if (!scanner.next()) {
                break;
            }
            a[i] = scanner.value();
        }

        final long[] prefix = new long[n + 1];
        prefixSums(a, n, prefix);

        int q = 0;
        if (scanner.next()) {
            q = (int) Math.min(scanner.value(), Integer.MAX_VALUE);
        }
        if (q < 0) {
            q = 0;
        }

        final StringBuilder out = new StringBuilder();
        for (int j = 0; j < q; j++) {
            if (!scanner.next()) {
                break;
            }
            final int l = (int) Math.min(scanner.value(), Integer.MAX_VALUE);
            if (!scanner.next()) {
                break;
            }
            final int r = (int) Math.min(scanner.value(), Integer.MAX_VALUE);

            // A range that leaves the array is clipped, so the lookup stays
            // in bounds; a range that is empty after clipping sums to zero.
            final int left = Math.max(l, 1);
            final int right = Math.min(r, n);
            if (left > right) {
                out.append("0");
            } else {
                out.append(prefix[right] - prefix[left - 1]);
            }
            out.append(System.lineSeparator());
        }
        System.out.print(out);
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
