import java.io.IOException;
import java.io.InputStream;

/**
 * A merge sort tree over a static array, driven from standard input.
 *
 * <p>Every node of a segment tree stores the sorted values of its interval, and
 * a rank query binary searches the O(log n) nodes that partition the requested
 * range.
 *
 * <p>Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */
public final class Main {

    private Main() {
    }

    /**
     * The number of values in the sorted list that are at most limit.
     */
    private static int upperBound(long[] values, long limit) {
        if (values == null) {
            return 0;
        }
        int low = 0;
        int high = values.length;
        while (low < high) {
            final int middle = low + (high - low) / 2;
            if (values[middle] <= limit) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return low;
    }

    /**
     * The sorted merge of two sorted lists, the merge sort step of the tree.
     */
    private static long[] merge(long[] left, long[] right) {
        final long[] merged = new long[left.length + right.length];
        int i = 0;
        int j = 0;
        int k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) {
                merged[k++] = left[i++];
            } else {
                merged[k++] = right[j++];
            }
        }
        while (i < left.length) {
            merged[k++] = left[i++];
        }
        while (j < right.length) {
            merged[k++] = right[j++];
        }
        return merged;
    }

    /**
     * The number of positions in [left, right) whose value is at most limit.
     */
    private static long countAtMost(long[][] tree, int size, int left, int right, long limit) {
        long total = 0;
        int l = left + size;
        int r = right + size;
        while (l < r) {
            if ((l & 1) != 0) {
                total += upperBound(tree[l], limit);
                l += 1;
            }
            if ((r & 1) != 0) {
                r -= 1;
                total += upperBound(tree[r], limit);
            }
            l >>= 1;
            r >>= 1;
        }
        return total;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        final int q = (int) fs.nextLong();
        if (n <= 0) {
            return;
        }

        final long[] values = new long[n];
        long minimum = Long.MAX_VALUE;
        long maximum = Long.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            values[i] = fs.nextLong();
            minimum = Math.min(minimum, values[i]);
            maximum = Math.max(maximum, values[i]);
        }

        int size = 1;
        while (size < n) {
            size *= 2;
        }

        final long[][] tree = new long[2 * size][];
        for (int i = 0; i < n; i++) {
            tree[size + i] = new long[] {values[i]};
        }
        for (int i = size - 1; i >= 1; i--) {
            final long[] left = tree[2 * i];
            final long[] right = tree[2 * i + 1];
            if (left == null) {
                tree[i] = right;
            } else if (right == null) {
                tree[i] = left;
            } else {
                tree[i] = merge(left, right);
            }
        }

        final StringBuilder output = new StringBuilder();
        final String lineSeparator = System.lineSeparator();
        for (int query = 0; query < q; query++) {
            final int left = (int) fs.nextLong() - 1;
            final int right = (int) fs.nextLong();
            final long k = fs.nextLong();

            // The least value whose rank in the range reaches k is the k-th
            // smallest, and the rank is monotone in the value.
            long low = minimum;
            long high = maximum;
            while (low < high) {
                final long middle = low + (high - low) / 2;
                if (countAtMost(tree, size, left, right, middle) >= k) {
                    high = middle;
                } else {
                    low = middle + 1;
                }
            }
            output.append(low).append(lineSeparator);
        }
        System.out.print(output);
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
