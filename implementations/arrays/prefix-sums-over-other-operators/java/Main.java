import java.io.IOException;
import java.io.InputStream;

/**
 * Prefix products over a static array.
 *
 * <p>Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints the product of each range modulo 1000000007.
 * A prefix table of the nonzero values, a prefix table of zero counts and a
 * backward-built table of inverse prefix products answer each query in
 * constant time.
 */
public final class Main {

    private static final long MODULO = 1000000007L;

    private Main() {
    }

    private static long modPower(final long baseValue, final long exponentValue) {
        long base = baseValue % MODULO;
        long exponent = exponentValue;
        long result = 1L;
        while (exponent > 0L) {
            if ((exponent & 1L) != 0L) {
                result = result * base % MODULO;
            }
            base = base * base % MODULO;
            exponent >>= 1;
        }
        return result;
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

        final long[] value = new long[n + 1];
        final long[] product = new long[n + 1];
        final long[] inverse = new long[n + 1];
        final long[] zeros = new long[n + 1];
        product[0] = 1L;

        for (int i = 1; i <= n; i++) {
            if (!scanner.next()) {
                break;
            }
            long x = scanner.value() % MODULO;
            if (x < 0) {
                x += MODULO;
            }
            value[i] = x;
            zeros[i] = zeros[i - 1] + (x == 0L ? 1L : 0L);
            product[i] = product[i - 1] * (x == 0L ? 1L : x) % MODULO;
        }

        inverse[n] = modPower(product[n], MODULO - 2L);
        for (int i = n; i >= 1; i--) {
            final long factor = value[i] == 0L ? 1L : value[i];
            inverse[i - 1] = inverse[i] * factor % MODULO;
        }

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

            if (zeros[r] - zeros[l - 1] > 0L) {
                out.append('0');
            } else {
                out.append(product[r] * inverse[l - 1] % MODULO);
            }
            out.append('\n');
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

        FastScanner(final InputStream input) {
            this.in = input;
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

            long parsed = 0L;
            while (c >= '0' && c <= '9') {
                parsed = parsed * 10L + (c - '0');
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
