import java.io.IOException;
import java.io.InputStream;

/**
 * Minimum cost path with hops of at most k positions.
 *
 * <p>Input: n k, then n integers a[1..n].
 * Output: dp[n], on one line.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = Math.max(0, (int) fs.nextLong());
        final int k = Math.max(1, (int) fs.nextLong());

        final long[] dp = new long[n + 1];
        // The deque holds indices with strictly increasing dp values, so the
        // front is the cheapest candidate inside the current window.
        final int[] deque = new int[n + 1];
        int head = 0;
        int tail = 0;
        deque[tail++] = 0;

        int kept = 0;
        for (int i = 1; i <= n; i++) {
            final long value = fs.nextLong();

            // The window is [i - k, i - 1], so an index is stale only when it
            // is strictly smaller than i - k.
            while (head < tail && deque[head] < i - k) {
                head++;
            }

            dp[i] = value + dp[deque[head]];

            // An older index with a value no smaller than dp[i] can never be
            // the minimum again: i expires later and is at least as cheap.
            while (head < tail && dp[deque[tail - 1]] >= dp[i]) {
                tail--;
            }
            deque[tail++] = i;
            kept = i;
        }

        System.out.println(dp[kept]);
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
