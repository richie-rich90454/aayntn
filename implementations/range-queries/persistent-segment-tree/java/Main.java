import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Persistent segment tree over the compressed values of a static array.
 *
 * <p>Version i is the frequency tree of a[0..i), built from version i - 1 by
 * copying only the root-to-leaf path of the inserted value. The difference
 * between version r and version l - 1 is the frequency tree of a[l-1..r), so
 * one descent that subtracts the two left counts returns the k-th smallest.
 *
 * <p>Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */
public final class Main {

    private static int[] leftChild;
    private static int[] rightChild;
    private static int[] count;
    private static int nodes;

    private Main() {
    }

    /**
     * Copy the path to position and increment every count on it. Node 0 is the
     * empty node, so previous == 0 needs no special case.
     */
    private static int update(int previous, int low, int high, int position) {
        final int node = ++nodes;
        leftChild[node] = leftChild[previous];
        rightChild[node] = rightChild[previous];
        count[node] = count[previous] + 1;
        if (low < high) {
            final int middle = low + (high - low) / 2;
            if (position <= middle) {
                leftChild[node] = update(leftChild[previous], low, middle, position);
            } else {
                rightChild[node] = update(rightChild[previous], middle + 1, high, position);
            }
        }
        return node;
    }

    /**
     * The k-th smallest rank in the multiset stored by after minus before.
     */
    private static int kth(int before, int after, int low, int high, int k) {
        while (low < high) {
            final int middle = low + (high - low) / 2;
            final int inLeft = count[leftChild[after]] - count[leftChild[before]];
            if (k <= inLeft) {
                before = leftChild[before];
                after = leftChild[after];
                high = middle;
            } else {
                k -= inLeft;
                before = rightChild[before];
                after = rightChild[after];
                low = middle + 1;
            }
        }
        return low;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner(System.in);
        final int n = scanner.nextInt();
        final int q = scanner.nextInt();
        if (n <= 0) {
            return;
        }

        final long[] values = new long[n];
        for (int i = 0; i < n; ++i) {
            values[i] = scanner.nextInt();
        }

        final long[] sorted = values.clone();
        Arrays.sort(sorted);
        int m = 1;
        for (int i = 1; i < n; ++i) {
            if (sorted[i] != sorted[m - 1]) {
                sorted[m++] = sorted[i];
            }
        }

        int depth = 0;
        while ((1L << depth) < m) {
            ++depth;
        }
        final int capacity = (int) ((n + 1L) * (depth + 2L) + 1L);
        leftChild = new int[capacity];
        rightChild = new int[capacity];
        count = new int[capacity];
        nodes = 0;

        final int[] roots = new int[n + 1];
        for (int i = 1; i <= n; ++i) {
            final int position = lowerBound(sorted, m, values[i - 1]) + 1;
            roots[i] = update(roots[i - 1], 1, m, position);
        }

        final StringBuilder output = new StringBuilder();
        final String lineSeparator = System.lineSeparator();
        for (int query = 0; query < q; ++query) {
            final int left = scanner.nextInt();
            final int right = scanner.nextInt();
            final int k = scanner.nextInt();
            final int answer = kth(roots[left - 1], roots[right], 1, m, k);
            output.append(sorted[answer - 1]).append(lineSeparator);
        }
        System.out.print(output);
    }

    /** The first index in values[0..length) whose value is at least key. */
    private static int lowerBound(long[] values, int length, long key) {
        int low = 0;
        int high = length;
        while (low < high) {
            final int middle = low + (high - low) / 2;
            if (values[middle] < key) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return low;
    }

    /** A byte scanner that is substantially cheaper than java.util.Scanner. */
    private static final class FastScanner {
        private final InputStream stream;
        private final byte[] buffer = new byte[1 << 16];
        private int length;
        private int index;

        private FastScanner(InputStream stream) {
            this.stream = stream;
        }

        private int nextInt() throws IOException {
            int c = read();
            while (c <= ' ') {
                if (c < 0) {
                    return -1;
                }
                c = read();
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }
            int value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = read();
            }
            return value * sign;
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
