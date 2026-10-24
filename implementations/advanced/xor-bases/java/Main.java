import java.io.IOException;
import java.io.InputStream;

/**
 * XOR basis over 30 bits, driven from standard input.
 *
 * <p>Input: n, then n values, then q, then q query values. Output: for each
 * query x, the maximum of x XOR a subset XOR of the values.
 */
public final class Main {

    private static final int BITS = 30;

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();

        final int n = scanner.nextInt();
        if (n < 0) {
            return;
        }
        final int[] basis = new int[BITS];
        for (int k = 0; k < n; k++) {
            int value = scanner.nextInt();
            for (int bit = BITS - 1; bit >= 0; bit--) {
                if (((value >>> bit) & 1) == 0) {
                    continue;
                }
                if (basis[bit] != 0) {
                    value ^= basis[bit];
                } else {
                    basis[bit] = value;
                    break;
                }
            }
        }

        final int q = scanner.nextInt();
        if (q < 0) {
            return;
        }
        final StringBuilder out = new StringBuilder();
        final String eol = System.lineSeparator();
        for (int k = 0; k < q; k++) {
            int x = scanner.nextInt();
            for (int bit = BITS - 1; bit >= 0; bit--) {
                if (basis[bit] != 0 && (x ^ basis[bit]) > x) {
                    x ^= basis[bit];
                }
            }
            out.append(x).append(eol);
        }
        System.out.print(out);
    }

    /**
     * Token scanner over standard input: the largest stated input is too big
     * for the one-token-at-a-time overhead of java.util.Scanner.
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
            return buffer[pointer++] & 0xFF;
        }

        int nextInt() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            final int sign = c == '-' ? -1 : 1;
            if (c == '-') {
                c = readByte();
            }
            int value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
