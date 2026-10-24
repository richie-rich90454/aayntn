import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/**
 * Count the tilings of an r x c grid with 1 x 2 and 2 x 1 dominoes.
 *
 * <p>Input: r c, then r strings of c characters. '0' is a free cell and '1' is
 * blocked.
 * <p>Output: the number of ways to cover every free cell exactly once.
 *
 * <p>Before cell k the mask describes the next c cells: bit d is 1 when cell
 * k + d is already covered by a domino placed earlier. Bit 0 is cell k.
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

        final int r = Integer.parseInt(tokens.nextToken());
        final int c = Integer.parseInt(tokens.nextToken());
        if (r <= 0 || c <= 0) {
            System.out.print("1\n");
            return;
        }

        final String[] grid = new String[r];
        for (int i = 0; i < r; i++) {
            grid[i] = tokens.hasMoreTokens() ? tokens.nextToken() : "0".repeat(c);
        }

        final int size = 1 << c;
        final long[] dp = new long[size];
        final long[] next = new long[size];
        dp[0] = 1L;

        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                final int k = i * c + j;
                java.util.Arrays.fill(next, 0L);
                for (int mask = 0; mask < size; mask++) {
                    final long ways = dp[mask];
                    if (ways == 0L) {
                        continue;
                    }
                    final int base = mask >> 1;

                    if (grid[i].charAt(j) == '1') {
                        if ((mask & 1) == 0) {
                            next[base] += ways;
                        }
                    } else if ((mask & 1) != 0) {
                        next[base] += ways;
                    } else {
                        if (j + 1 < c && grid[i].charAt(j + 1) == '0' && (mask & 2) == 0) {
                            next[base | 1] += ways;
                        }
                        if (i + 1 < r && grid[i + 1].charAt(j) == '0') {
                            next[base | (1 << (c - 1))] += ways;
                        }
                    }
                }
                System.arraycopy(next, 0, dp, 0, size);
            }
        }

        System.out.print(dp[0] + "\n");
    }
}
