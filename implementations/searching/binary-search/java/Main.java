import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Binary search driver.
 *
 * <p>Reads n, a sorted run of integers and a target from standard input, then
 * prints the 0-based index of the target, or -1 when it is absent.
 */
public final class Main {

    private Main() {
    }

    public static void main(final String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);
        final long[] values = readAllValues(scanner);

        /*
         * The target is the final token and the array takes at most n of the
         * tokens before it, so a header that disagrees with the data cannot
         * swallow the target.
         */
        if (values.length < 2) {
            System.out.println(-1);
            return;
        }

        final long declared = values[0];
        final long target = values[values.length - 1];
        final long available = values.length - 2L;
        long arrayLength = Math.min(declared, available);
        if (arrayLength < 0) {
            arrayLength = 0;
        }

        final long[] a = new long[(int) arrayLength];
        System.arraycopy(values, 1, a, 0, (int) arrayLength);

        System.out.println(binarySearch(a, target));
    }

    private static int binarySearch(final long[] a, final long target) {
        int lo = 0;
        int hi = a.length - 1;

        while (lo <= hi) {
            final int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) {
                return mid;
            }
            if (a[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return -1;
    }

    private static long[] readAllValues(final FastScanner scanner) throws IOException {
        long[] values = new long[64];
        int size = 0;

        while (scanner.next()) {
            if (size == values.length) {
                values = Arrays.copyOf(values, values.length * 2);
            }
            values[size++] = scanner.value();
        }
        return Arrays.copyOf(values, size);
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
