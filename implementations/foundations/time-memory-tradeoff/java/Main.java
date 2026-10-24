import java.io.IOException;
import java.io.InputStream;

/**
 * A block-prefix table over a static array, driven from standard input.
 *
 * <p>Input: n, then n scores, then q, then q pairs l r.
 * Output: one line per query, holding the sum a_l + ... + a_r.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        if (n < 1) {
            return;
        }

        int block = 1;
        while ((long) (block + 1) * (block + 1) <= n) {
            block++;
        }
        final int blocks = (n + block - 1) / block;

        final long[] inside = new long[n + 1];
        final long[] base = new long[blocks + 1];
        for (int i = 1; i <= n; i++) {
            inside[i] = fs.nextLong();
        }

        long total = 0;
        for (int b = 0; b < blocks; b++) {
            base[b] = total;
            long run = 0;
            final int start = b * block + 1;
            final int end = Math.min(n, start + block - 1);
            for (int i = start; i <= end; i++) {
                run += inside[i];
                inside[i] = run;
            }
            total += run;
        }
        base[blocks] = total;

        final int q = (int) fs.nextLong();
        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final int l = (int) fs.nextLong();
            final int r = (int) fs.nextLong();
            out.append(prefix(base, inside, block, r) - prefix(base, inside, block, l - 1));
            out.append('\n');
        }
        System.out.print(out);
    }

    private static long prefix(long[] base, long[] inside, int block, int i) {
        if (i == 0) {
            return 0;
        }
        return base[(i - 1) / block] + inside[i];
    }

    /**
     * Token scanner over standard input: contest inputs are far too large for
     * java.util.Scanner.
     */
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
