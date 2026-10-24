import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/*
 * The hook-length formula: n! divided by the product of the hook lengths
 * of all cells, with the division performed by a Fermat inverse.
 */
public final class Main {
    private static final long MODULUS = 1000000007L;

    private static long modPow(long base, long exponent) {
        long result = 1;
        base %= MODULUS;
        while (exponent > 0) {
            if ((exponent & 1L) != 0) {
                result = result * base % MODULUS;
            }
            base = base * base % MODULUS;
            exponent >>= 1;
        }
        return result;
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

        final int k = Integer.parseInt(tokens.nextToken());
        if (k < 0) {
            return;
        }

        final int[] rows = new int[k];
        long n = 0;
        for (int i = 0; i < k; i++) {
            if (!tokens.hasMoreTokens()) {
                return;
            }
            rows[i] = Integer.parseInt(tokens.nextToken());
            if (rows[i] < 0) {
                return;
            }
            n += rows[i];
        }

        final int width = (k > 0) ? rows[0] : 0;
        final int[] heights = new int[width];
        for (int i = 0; i < k; i++) {
            for (int j = 0; j < rows[i]; j++) {
                heights[j]++;
            }
        }

        long numerator = 1;
        for (long i = 2; i <= n; i++) {
            numerator = numerator * (i % MODULUS) % MODULUS;
        }

        long denominator = 1;
        for (int i = 0; i < k; i++) {
            for (int j = 0; j < rows[i]; j++) {
                final long hook = (long) rows[i] - j + heights[j] - i - 1;
                denominator = denominator * (hook % MODULUS) % MODULUS;
            }
        }

        final long answer = numerator * modPow(denominator, MODULUS - 2) % MODULUS;
        System.out.println(answer);
    }
}
