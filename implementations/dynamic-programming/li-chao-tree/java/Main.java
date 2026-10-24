import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Li Chao tree over the query coordinates read from standard input.
 *
 * <p>Input: q, then q lines of either 1 m b or 2 x.
 * Output: one line per 2 x operation, holding the minimum value at x over
 * every line inserted so far.
 */
public final class Main {

    private static long[] xs;
    private static long[] slope;
    private static long[] intercept;
    private static boolean[] used;

    private Main() {
    }

    private static long evaluate(long m, long b, long x) {
        return m * x + b;
    }

    private static void addLine(long m, long b, int node, int left, int right) {
        if (!used[node]) {
            used[node] = true;
            slope[node] = m;
            intercept[node] = b;
            return;
        }

        final int mid = left + (right - left) / 2;
        final boolean betterLeft = evaluate(m, b, xs[left]) < evaluate(slope[node], intercept[node], xs[left]);
        final boolean betterMid = evaluate(m, b, xs[mid]) < evaluate(slope[node], intercept[node], xs[mid]);

        if (betterMid) {
            final long oldM = slope[node];
            final long oldB = intercept[node];
            slope[node] = m;
            intercept[node] = b;
            m = oldM;
            b = oldB;
        }

        if (left == right) {
            return;
        }

        if (betterLeft != betterMid) {
            addLine(m, b, node * 2, left, mid);
        } else {
            addLine(m, b, node * 2 + 1, mid + 1, right);
        }
    }

    private static long query(int node, int left, int right, int index) {
        long best = used[node]
                ? evaluate(slope[node], intercept[node], xs[index])
                : Long.MAX_VALUE;

        if (left == right) {
            return best;
        }

        final int mid = left + (right - left) / 2;
        final long child = index <= mid
                ? query(node * 2, left, mid, index)
                : query(node * 2 + 1, mid + 1, right, index);

        return Math.min(best, child);
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();
        final int q = (int) scanner.nextLong();
        if (q <= 0) {
            return;
        }

        final int[] kind = new int[q];
        final long[] first = new long[q];
        final long[] second = new long[q];
        final long[] allCoordinates = new long[q];
        int count = 0;

        for (int i = 0; i < q; i++) {
            kind[i] = (int) scanner.nextLong();
            if (kind[i] == 1) {
                first[i] = scanner.nextLong();
                second[i] = scanner.nextLong();
            } else {
                first[i] = scanner.nextLong();
                allCoordinates[count++] = first[i];
            }
        }

        Arrays.sort(allCoordinates, 0, count);
        int k = 0;
        for (int i = 0; i < count; i++) {
            if (k == 0 || allCoordinates[i] != allCoordinates[k - 1]) {
                allCoordinates[k++] = allCoordinates[i];
            }
        }

        if (k == 0) {
            return;
        }

        xs = Arrays.copyOf(allCoordinates, k);
        slope = new long[4 * k];
        intercept = new long[4 * k];
        used = new boolean[4 * k];

        final StringBuilder output = new StringBuilder();
        for (int i = 0; i < q; i++) {
            if (kind[i] == 1) {
                addLine(first[i], second[i], 1, 0, k - 1);
            } else {
                final int index = Arrays.binarySearch(xs, first[i]);
                output.append(query(1, 0, k - 1, index)).append('\n');
            }
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
