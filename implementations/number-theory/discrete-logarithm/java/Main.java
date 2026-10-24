import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.StringTokenizer;

/**
 * The discrete logarithm by baby-step giant-step.
 *
 * <p>Input: q, then q lines holding a, b and m with gcd(a, m) = 1.
 * Output: the smallest non-negative x with a^x = b (mod m), or -1.
 */
public final class Main {

    private static final int EMPTY = -1;

    private Main() {
    }

    private static long mulMod(long a, long b, long m) {
        return a * b % m;
    }

    private static long powMod(long a, long e, long m) {
        long result = 1 % m;
        a %= m;
        while (e > 0) {
            if ((e & 1L) == 1L) {
                result = mulMod(result, a, m);
            }
            a = mulMod(a, a, m);
            e >>>= 1;
        }
        return result;
    }

    private static long discreteLog(long a, long b, long m) {
        if (b == 1) {
            return 0;
        }

        long n = 1;
        while (n * n < m) {
            n++;
        }

        int size = 1;
        while ((long) size < 2 * n) {
            size <<= 1;
        }
        final int mask = size - 1;

        final int[] keys = new int[size];
        Arrays.fill(keys, EMPTY);
        final int[] values = new int[size];

        // Baby steps: key b * a^q, keeping the largest q for a repeated key.
        long cur = b % m;
        for (long q = 0; q < n; q++) {
            final int key = (int) cur;
            int h = (int) ((key * 40503L) & mask);
            while (keys[h] != EMPTY && keys[h] != key) {
                h = (h + 1) & mask;
            }
            keys[h] = key;
            values[h] = (int) q;
            cur = mulMod(cur, a, m);
        }

        // Giant steps: a^(p * n), matched against the baby-step keys.
        final long stride = powMod(a, n, m);
        cur = 1;
        for (long p = 1; p <= n; p++) {
            cur = mulMod(cur, stride, m);
            final int key = (int) cur;
            int h = (int) ((key * 40503L) & mask);
            while (keys[h] != EMPTY) {
                if (keys[h] == key) {
                    return p * n - values[h];
                }
                h = (h + 1) & mask;
            }
        }

        return -1;
    }

    public static void main(String[] args) throws IOException {
        final StringTokenizer tokens = new StringTokenizer(
                new String(System.in.readAllBytes(), StandardCharsets.US_ASCII));
        if (!tokens.hasMoreTokens()) {
            return;
        }

        final int count = Integer.parseInt(tokens.nextToken());
        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < count && tokens.hasMoreTokens(); i++) {
            final long a = Long.parseLong(tokens.nextToken());
            final long b = Long.parseLong(tokens.nextToken());
            final long m = Long.parseLong(tokens.nextToken());
            out.append(discreteLog(a, b, m)).append('\n');
        }
        System.out.print(out);
    }
}
