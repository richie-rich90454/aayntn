import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/**
 * String hashing of subsequences.
 *
 * <p>Input: one string s, a query count q, and q pairs of 0-based indices.
 * Output: SAME when deleting s[i] and deleting s[j] leave the same string,
 * DIFFERENT otherwise.
 *
 * <p>The hash of the string with s[i] deleted is the hash of the prefix before
 * i shifted by the length of the remaining suffix, plus the hash of the suffix
 * after i. Both pieces come from tables built once, so a query is constant
 * time.
 */
public final class Main {

    private static final long BASE = 8000011L;
    private static final long MOD = 90000049L;

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        final String line = reader.readLine();
        if (line == null) {
            return;
        }
        final String s = line.trim();
        final int n = s.length();

        final long[] power = new long[n + 1];
        final long[] prefix = new long[n + 1];
        final long[] suffix = new long[n + 1];

        power[0] = 1;
        for (int i = 1; i <= n; i++) {
            power[i] = power[i - 1] * BASE % MOD;
        }
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = (prefix[i] * BASE + (s.charAt(i) - 'a' + 1)) % MOD;
        }
        for (int i = n - 1; i >= 0; i--) {
            suffix[i] = ((s.charAt(i) - 'a' + 1) * power[n - 1 - i] + suffix[i + 1]) % MOD;
        }

        final int q = Integer.parseInt(reader.readLine().trim());
        final StringBuilder out = new StringBuilder();
        for (int query = 0; query < q; query++) {
            final StringTokenizer tokens = new StringTokenizer(reader.readLine());
            final int i = Integer.parseInt(tokens.nextToken());
            final int j = Integer.parseInt(tokens.nextToken());
            final long di = (prefix[i] * power[n - 1 - i] + suffix[i + 1]) % MOD;
            final long dj = (prefix[j] * power[n - 1 - j] + suffix[j + 1]) % MOD;
            out.append(di == dj ? "SAME" : "DIFFERENT").append('\n');
        }
        System.out.print(out);
    }
}
