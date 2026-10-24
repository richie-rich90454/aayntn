import java.io.IOException;
import java.io.InputStream;

/**
 * Parametric search driver.
 *
 * <p>Reads n, n nonnegative values and a budget, then prints the largest level
 * x whose capped sum, the sum of min(a[i], x), is at most the budget.
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

        if (declared <= 0 || declared > Integer.MAX_VALUE) {
            System.out.println(0);
            return;
        }

        final int n = (int) declared;
        final long[] a = new long[n];
        long maxValue = 0;

        for (int i = 0; i < n; ++i) {
            if (!scanner.next()) {
                System.out.println(0);
                return;
            }
            a[i] = scanner.value();
            if (a[i] > maxValue) {
                maxValue = a[i];
            }
        }

        if (!scanner.next()) {
            System.out.println(0);
            return;
        }

        final long budget = scanner.value();
        long lo = 0;
        long hi = maxValue;
        long answer = 0;

        while (lo <= hi) {
            final long mid = lo + (hi - lo) / 2;

            if (feasible(a, mid, budget)) {
                answer = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        System.out.println(answer);
    }

    private static boolean feasible(final long[] a, final long x, final long budget) {
        long total = 0;

        for (final long value : a) {
            total += value < x ? value : x;
            if (total > budget) {
                return false;
            }
        }
        return true;
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
