import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/**
 * Matrix chain multiplication with the monotone split window.
 *
 * <p>Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
 * p[i] by p[i + 1], for 0 &lt;= i &lt; n.
 * <p>Output: the minimum number of scalar multiplications.
 *
 * <p>The split for a range [i, j] is only searched in
 * [opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic
 * interval table into a quadratic one.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        final StringBuilder text = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            text.append(line).append(' ');
        }
        final StringTokenizer tokens = new StringTokenizer(text.toString());
        if (!tokens.hasMoreTokens()) {
            return;
        }

        final int n = Integer.parseInt(tokens.nextToken());
        if (n <= 0) {
            System.out.print("0\n");
            return;
        }

        final long[] p = new long[n + 1];
        for (int i = 0; i <= n; i++) {
            p[i] = tokens.hasMoreTokens() ? Long.parseLong(tokens.nextToken()) : 1L;
        }

        final long[][] dp = new long[n][n];
        final int[][] opt = new int[n][n];
        for (int i = 0; i < n; i++) {
            opt[i][i] = i;
        }

        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length <= n; i++) {
                final int j = i + length - 1;
                int lo = opt[i][j - 1];
                int hi = opt[i + 1][j];
                if (lo < i) {
                    lo = i;
                }
                if (hi > j - 1) {
                    hi = j - 1;
                }
                if (lo > hi) {
                    lo = i;
                    hi = j - 1;
                }

                long best = -1L;
                int bestK = lo;
                for (int k = lo; k <= hi; k++) {
                    final long cost =
                            dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1];
                    if (best < 0L || cost < best) {
                        best = cost;
                        bestK = k;
                    }
                }
                dp[i][j] = best;
                opt[i][j] = bestK;
            }
        }

        System.out.print(dp[0][n - 1] + "\n");
    }
}
