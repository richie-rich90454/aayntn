import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class Main {
    private static final int MOD = 1000000007;

    /*
     * Subset zeta transform.
     *
     * Input: n, then the 2^n values f[0] .. f[2^n - 1], one value per mask.
     * Output: g[0] .. g[2^n - 1], where g[S] is the sum of f[T] over T subset of S,
     * reduced modulo 1000000007.
     */
    public static void main(String[] args) throws IOException {
        FastScanner scanner = new FastScanner(System.in);
        int n = scanner.nextInt();
        if (n < 0 || n > 24) {
            return;
        }

        int total = 1 << n;
        int[] g = new int[total];
        for (int mask = 0; mask < total; mask++) {
            g[mask] = scanner.nextInt();
        }

        for (int bit = 0; bit < n; bit++) {
            int step = 1 << bit;
            for (int base = 0; base < total; base += step << 1) {
                for (int off = 0; off < step; off++) {
                    int target = g[base + step + off] + g[base + off];
                    if (target >= MOD) {
                        target -= MOD;
                    }
                    g[base + step + off] = target;
                }
            }
        }

        StringBuilder output = new StringBuilder();
        for (int mask = 0; mask < total; mask++) {
            if (mask > 0) {
                output.append(' ');
            }
            output.append(g[mask]);
        }
        output.append('\n');

        OutputStream out = System.out;
        out.write(output.toString().getBytes(StandardCharsets.US_ASCII));
        out.flush();
    }

    private static final class FastScanner {
        private final InputStream stream;
        private final byte[] buffer = new byte[1 << 16];
        private int length = 0;
        private int index = 0;

        FastScanner(InputStream stream) {
            this.stream = stream;
        }

        int nextInt() throws IOException {
            int character = read();
            while (character <= ' ') {
                if (character == -1) {
                    return 0;
                }
                character = read();
            }

            boolean negative = false;
            if (character == '-') {
                negative = true;
                character = read();
            }

            int value = 0;
            while (character > ' ') {
                value = value * 10 + (character - '0');
                character = read();
            }
            return negative ? -value : value;
        }

        private int read() throws IOException {
            if (index >= length) {
                length = stream.read(buffer);
                index = 0;
                if (length <= 0) {
                    return -1;
                }
            }
            return buffer[index++];
        }
    }
}
