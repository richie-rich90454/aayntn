import java.io.IOException;
import java.io.InputStream;

/**
 * Square-root decomposition over a 1-indexed array, driven from standard input.
 *
 * <p>Input: n q, then q operations. "1 i delta" adds delta to the value at the
 * 1-based index i, and "2 l r" queries the sum over the inclusive range [l, r].
 * Output: one line per query, holding the range sum.
 */
public final class program {

    private program() {
    }

    /**
     * An array cut into blocks of about sqrt(n) positions. sum[b] holds the
     * total of block b, so a point update changes one value and one block,
     * while a range query reads whole blocks in one step each and scans only
     * the two partial blocks at the ends.
     */
    public static final class SqrtDecomposition {
        private final int n;
        private final int block;
        private final long[] value;
        private final long[] sum;

        public SqrtDecomposition(int n) {
            this.n = Math.max(0, n);
            int size = 1;
            while ((long) size * size < this.n) {
                size += 1;
            }
            this.block = size;
            final int blocks = (this.n + size - 1) / size;
            this.value = new long[this.n];
            this.sum = new long[blocks];
        }

        /**
         * Adds delta to the value at the 1-based index.
         */
        public void add(int index, long delta) {
            final int position = index - 1;
            if (position >= 0 && position < n) {
                value[position] += delta;
                sum[position / block] += delta;
            }
        }

        /**
         * The sum of the positions left..right, both inclusive.
         */
        public long rangeSum(int left, int right) {
            int first = left - 1;
            int last = right - 1;
            if (first < 0) {
                first = 0;
            }
            if (last >= n) {
                last = n - 1;
            }
            if (first > last) {
                return 0;
            }

            final int firstFull = (first + block - 1) / block;
            final int lastFull = (last + 1) / block - 1;
            if (firstFull > lastFull) {
                long total = 0;
                for (int i = first; i <= last; i++) {
                    total += value[i];
                }
                return total;
            }

            long total = 0;
            for (int i = first; i < firstFull * block; i++) {
                total += value[i];
            }
            for (int b = firstFull; b <= lastFull; b++) {
                total += sum[b];
            }
            for (int i = (lastFull + 1) * block; i <= last; i++) {
                total += value[i];
            }
            return total;
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();
        final int n = (int) scanner.nextLong();
        final int q = (int) scanner.nextLong();
        final SqrtDecomposition array = new SqrtDecomposition(n);

        final StringBuilder out = new StringBuilder();
        final String eol = System.lineSeparator();
        for (int k = 0; k < q; k++) {
            final int kind = (int) scanner.nextLong();
            if (kind == 1) {
                final int index = (int) scanner.nextLong();
                final long delta = scanner.nextLong();
                array.add(index, delta);
            } else if (kind == 2) {
                final int left = (int) scanner.nextLong();
                final int right = (int) scanner.nextLong();
                out.append(array.rangeSum(left, right)).append(eol);
            } else {
                break;
            }
        }
        System.out.print(out);
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
            final int sign = c == '-' ? -1 : 1;
            if (c == '-') {
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
