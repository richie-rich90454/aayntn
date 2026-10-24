import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Reads n weights and a capacity, then prints the largest number of weights
 * whose total is at most the capacity.
 *
 * <p>Input: n and W, then n weights separated by whitespace.
 * Output: one line holding the count.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();
        final int n = (int) scanner.nextLong();
        final long capacity = scanner.nextLong();

        if (n <= 0) {
            System.out.println(0);
            return;
        }

        final long[] weights = new long[n];
        for (int i = 0; i < n; i++) {
            weights[i] = scanner.nextLong();
        }

        Arrays.sort(weights);

        long used = 0;
        int count = 0;
        for (long weight : weights) {
            if (weight > capacity - used) {
                break;
            }
            used += weight;
            count++;
        }

        System.out.println(count);
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
