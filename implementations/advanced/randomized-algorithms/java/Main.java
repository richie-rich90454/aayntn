import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;

/*
 * Randomized quicksort with a three-way partition and a xorshift32 generator.
 * The generator is seeded with 2463534242 so that the six language variants
 * take the same pivots and report the same comparison count.
 */
public class Main {
    private static int rngState = (int) 2463534242L;
    private static long comparisons = 0;
    private static int[] values;

    private static int nextRandom() {
        int x = rngState;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        rngState = x;
        return x;
    }

    private static void swapValues(int i, int j) {
        int temporary = values[i];
        values[i] = values[j];
        values[j] = temporary;
    }

    private static void randomizedQuicksort(int lo, int hi) {
        if (lo >= hi) return;

        int pivot = values[lo + (int) ((nextRandom() & 0xFFFFFFFFL) % (hi - lo + 1))];
        int lt = lo;
        int i = lo;
        int gt = hi;

        while (i <= gt) {
            ++comparisons;
            if (values[i] < pivot) {
                swapValues(lt, i);
                ++lt;
                ++i;
            } else if (values[i] > pivot) {
                swapValues(i, gt);
                --gt;
            } else {
                ++i;
            }
        }

        randomizedQuicksort(lo, lt - 1);
        randomizedQuicksort(gt + 1, hi);
    }

    public static void main(String[] args) throws IOException {
        FastScanner scanner = new FastScanner();
        int n = scanner.nextInt();
        if (n <= 0) return;

        values = new int[n];
        for (int i = 0; i < n; ++i) values[i] = scanner.nextInt();

        randomizedQuicksort(0, n - 1);

        StringBuilder output = new StringBuilder();
        for (int i = 0; i < n; ++i) {
            if (i > 0) output.append(' ');
            output.append(values[i]);
        }
        output.append('\n').append(comparisons).append('\n');
        System.out.print(output);
    }

    private static final class FastScanner {
        private final InputStream stream = new BufferedInputStream(System.in);
        private final byte[] buffer = new byte[1 << 16];
        private int length = 0;
        private int pointer = 0;

        private int read() throws IOException {
            if (pointer >= length) {
                length = stream.read(buffer);
                pointer = 0;
                if (length <= 0) return -1;
            }
            return buffer[pointer++];
        }

        int nextInt() throws IOException {
            int c;
            do {
                c = read();
            } while (c <= ' ' && c != -1);
            if (c == -1) return -1;

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
    }
}
