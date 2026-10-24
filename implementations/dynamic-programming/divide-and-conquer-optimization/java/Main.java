import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;

/**
 * The minimum total squared group sum when an array is split into k contiguous
 * nonempty groups.
 *
 * <p>dp[g][i] = min over j &lt; i of dp[g - 1][j] + (prefix[i] - prefix[j])^2.
 * The best j never moves left as i grows, so the middle entry of a range is
 * solved directly and its optimal split point becomes the candidate bound of
 * both halves.
 */
public final class Main {

    private static final long INF = 4000000000000000000L;

    private static long[] prefix;
    private static long[] previous;
    private static long[] current;

    private Main() {
    }

    private static void solveLayer(int left, int right, int optLeft, int optRight) {
        if (left > right) {
            return;
        }

        final int mid = left + (right - left) / 2;
        final int upper = Math.min(optRight, mid - 1);
        long best = INF;
        int bestJ = optLeft;

        for (int j = optLeft; j <= upper; j++) {
            final long difference = prefix[mid] - prefix[j];
            final long candidate = previous[j] + difference * difference;
            if (candidate < best) {
                best = candidate;
                bestJ = j;
            }
        }

        current[mid] = best;
        /*
         * bestJ is the smallest optimal split point of mid, so every entry to
         * the left uses a split point at most bestJ and every entry to the
         * right uses one at least bestJ.
         */
        solveLayer(left, mid - 1, optLeft, bestJ);
        solveLayer(mid + 1, right, bestJ, optRight);
    }

    public static void main(String[] args) throws IOException {
        final StreamTokenizer in =
                new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
        if (in.nextToken() == StreamTokenizer.TT_EOF) {
            return;
        }
        int n = (int) in.nval;
        if (in.nextToken() == StreamTokenizer.TT_EOF) {
            return;
        }
        int k = (int) in.nval;

        if (n <= 0) {
            System.out.println("0");
            return;
        }
        if (k < 1) {
            k = 1;
        }
        if (k > n) {
            k = n;
        }

        prefix = new long[n + 1];
        for (int i = 1; i <= n; i++) {
            if (in.nextToken() == StreamTokenizer.TT_EOF) {
                break;
            }
            prefix[i] = prefix[i - 1] + (long) in.nval;
        }

        previous = new long[n + 1];
        current = new long[n + 1];
        java.util.Arrays.fill(previous, INF);
        java.util.Arrays.fill(current, INF);
        previous[0] = 0;

        for (int g = 1; g <= k; g++) {
            java.util.Arrays.fill(current, INF);
            /*
             * Layer g only needs prefixes that leave at least k - g elements
             * for the remaining groups.
             */
            final int last = n - k + g;
            solveLayer(g, last, g - 1, last - 1);

            final long[] swap = previous;
            previous = current;
            current = swap;
        }

        System.out.println(previous[n]);
    }
}
