import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    private static final long MODULO = 1000000007L;

    private static long modPow(long base, long exponent) {
        long result = 1;
        base %= MODULO;
        while (exponent > 0) {
            if ((exponent & 1L) == 1L) {
                result = result * base % MODULO;
            }
            base = base * base % MODULO;
            exponent >>= 1;
        }
        return result;
    }

    private static long binomial(long n, long k) {
        if (k < 0 || k > n) {
            return 0;
        }
        if (k > n - k) {
            k = n - k;
        }
        long numerator = 1;
        long denominator = 1;
        for (long i = 0; i < k; i++) {
            numerator = numerator * (n - i) % MODULO;
            denominator = denominator * (i + 1) % MODULO;
        }
        return numerator * modPow(denominator, MODULO - 2) % MODULO;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) {
            return;
        }
        line = line.trim();
        if (line.isEmpty()) {
            return;
        }
        long n = Long.parseLong(line);
        if (n < 0 || n > 1000000L) {
            return;
        }

        long total = binomial(2 * n, n);
        long bad = binomial(2 * n, n - 1);
        System.out.println((total - bad + MODULO) % MODULO);
    }
}
