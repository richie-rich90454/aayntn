import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * A wavelet tree over a static array, stored level by level (the layout is
 * also called a wavelet matrix).
 *
 * <p>Every level keeps a prefix count of the elements that descend to the left
 * child, and the values are stable partitioned before the next level. A k-th
 * smallest query descends one level at a time.
 *
 * <p>Input: n q, then the n values, then q lines "l r k" with 0-based
 * half-open bounds [l, r). Output: one line per query, holding the k-th
 * smallest value in a[l..r).
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        final int q = (int) fs.nextLong();
        if (n <= 0) {
            return;
        }

        final long[] values = new long[n];
        final long[] sorted = new long[n];
        for (int i = 0; i < n; i++) {
            values[i] = fs.nextLong();
            sorted[i] = values[i];
        }
        Arrays.sort(sorted);

        int distinct = 0;
        for (int i = 0; i < n; i++) {
            if (i == 0 || sorted[i] != sorted[distinct - 1]) {
                sorted[distinct] = sorted[i];
                distinct += 1;
            }
        }

        int bits = 0;
        while ((1 << bits) < distinct) {
            bits += 1;
        }

        final int[] cur = new int[n];
        final int[] next = new int[n];
        for (int i = 0; i < n; i++) {
            cur[i] = lowerBound(sorted, distinct, values[i]);
        }

        final int[][] prefix = new int[bits][];
        final int[] zeroCount = new int[bits];
        for (int level = 0; level < bits; level++) {
            final int shift = bits - 1 - level;
            prefix[level] = new int[n + 1];
            int zeros = 0;
            for (int i = 0; i < n; i++) {
                if (((cur[i] >> shift) & 1) == 0) {
                    zeros += 1;
                }
                prefix[level][i + 1] = zeros;
            }
            zeroCount[level] = zeros;

            int zeroPosition = 0;
            int onePosition = zeros;
            for (int i = 0; i < n; i++) {
                final int value = cur[i];
                if (((value >> shift) & 1) == 0) {
                    next[zeroPosition] = value;
                    zeroPosition += 1;
                } else {
                    next[onePosition] = value;
                    onePosition += 1;
                }
            }
            System.arraycopy(next, 0, cur, 0, n);
        }

        final StringBuilder output = new StringBuilder();
        final String lineSeparator = System.lineSeparator();
        for (int query = 0; query < q; query++) {
            int left = (int) fs.nextLong();
            int right = (int) fs.nextLong();
            long k = fs.nextLong();

            int rank = 0;
            for (int level = 0; level < bits; level++) {
                final int zerosLeft = prefix[level][left];
                final int zerosRight = prefix[level][right];
                final int zeros = zerosRight - zerosLeft;
                if (k <= zeros) {
                    left = zerosLeft;
                    right = zerosRight;
                    rank <<= 1;
                } else {
                    k -= zeros;
                    final int base = zeroCount[level];
                    left = base + (left - zerosLeft);
                    right = base + (right - zerosRight);
                    rank = (rank << 1) | 1;
                }
            }
            output.append(sorted[rank]).append(lineSeparator);
        }
        System.out.print(output);
    }

    /** The first position whose value is not less than the target. */
    private static int lowerBound(long[] values, int size, long target) {
        int low = 0;
        int high = size;
        while (low < high) {
            final int middle = low + (high - low) / 2;
            if (values[middle] < target) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return low;
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
