import java.io.IOException;
import java.io.InputStream;

/**
 * Deterministic quickselect over a signed 32-bit array.
 *
 * <p>The pivot is the median of the first, middle, and last value, and a
 * three-way partition removes every copy of it in one pass.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();

        final int n = scanner.nextInt();
        if (n <= 0) {
            return;
        }

        final int[] a = new int[n];
        for (int index = 0; index < n; index++) {
            a[index] = scanner.nextInt();
        }

        final int k = scanner.nextInt();
        if (k < 1 || k > n) {
            return;
        }

        System.out.println(select(a, k));
    }

    private static int select(int[] a, int k) {
        int lo = 0;
        int hi = a.length - 1;
        final int target = k - 1;

        while (lo < hi) {
            final int mid = lo + (hi - lo) / 2;
            final int pivot = medianOfThree(a, lo, mid, hi);
            int lt = lo;
            int i = lo;
            int gt = hi;

            while (i <= gt) {
                if (a[i] < pivot) {
                    swap(a, lt, i);
                    lt++;
                    i++;
                } else if (a[i] > pivot) {
                    swap(a, i, gt);
                    gt--;
                } else {
                    i++;
                }
            }

            if (target < lt) {
                hi = lt - 1;
            } else if (target > gt) {
                lo = gt + 1;
            } else {
                return pivot;
            }
        }

        return a[lo];
    }

    private static int medianOfThree(int[] a, int lo, int mid, int hi) {
        int x = a[lo];
        int y = a[mid];
        int z = a[hi];
        if (x > y) {
            final int temporary = x;
            x = y;
            y = temporary;
        }
        if (y > z) {
            final int temporary = y;
            y = z;
            z = temporary;
        }
        if (x > y) {
            final int temporary = x;
            x = y;
            y = temporary;
        }
        return y;
    }

    private static void swap(int[] a, int left, int right) {
        final int temporary = a[left];
        a[left] = a[right];
        a[right] = temporary;
    }

    /**
     * Token scanner over standard input: the largest stated input is too big
     * for the one-token-at-a-time overhead of java.util.Scanner.
     */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++] & 0xFF;
        }

        int nextInt() throws IOException {
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
            return (int) (value * sign);
        }
    }
}
