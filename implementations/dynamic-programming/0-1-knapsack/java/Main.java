import java.io.IOException;
import java.io.InputStream;

/**
 * 0/1 knapsack read from standard input.
 *
 * <p>Input: n W, then n lines w v.
 * Output: the maximum achievable total value, on one line.
 */
public final class Main {

    private Main() {
    }

    /**
     * Maximum total value of a subset of the items whose total weight is at
     * most capacity.
     *
     * @param weights  the weight of every item
     * @param values   the value of every item, parallel to weights
     * @param capacity the weight budget
     * @return the largest total value that fits in capacity
     */
    public static long knapsackMaxValue(int[] weights, long[] values, int capacity) {
        if (capacity < 0) {
            return 0;
        }

        final long[] table = new long[capacity + 1];
        final int count = Math.min(weights.length, values.length);
        for (int i = 0; i < count; i++) {
            final int weight = Math.max(0, weights[i]);

            // The capacity must run downwards: table[c - weight] has to still
            // hold the answer for the items before item i. With an upwards
            // sweep that cell would already include item i, so the item would
            // be counted more than once and the table would solve the
            // unbounded knapsack.
            for (int c = capacity; c >= weight; c--) {
                final long candidate = table[c - weight] + values[i];
                if (candidate > table[c]) {
                    table[c] = candidate;
                }
            }
        }

        return table[capacity];
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        final int capacity = (int) fs.nextLong();

        final int count = Math.max(0, n);
        final int budget = Math.max(0, capacity);
        final int[] weights = new int[count];
        final long[] values = new long[count];

        int kept = 0;
        for (int i = 0; i < count; i++) {
            final int weight = (int) fs.nextLong();
            final long value = fs.nextLong();
            weights[kept] = weight;
            values[kept] = value;
            kept++;
        }

        System.out.println(knapsackMaxValue(weights, values, budget));
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
