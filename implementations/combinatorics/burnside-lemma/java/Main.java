import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

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

    private static long eulerPhi(long x) {
        long result = x;
        long remaining = x;
        long p = 2;
        while (p * p <= remaining) {
            if (remaining % p == 0) {
                while (remaining % p == 0) {
                    remaining /= p;
                }
                result -= result / p;
            }
            p += (p == 2) ? 1 : 2;
        }
        if (remaining > 1) {
            result -= result / remaining;
        }
        return result;
    }

    private static long term(long d, long n, long k) {
        return eulerPhi(d) * modPow(k, n / d) % MODULO;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder input = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            input.append(line).append(' ');
        }
        StringTokenizer tokens = new StringTokenizer(input.toString());
        if (!tokens.hasMoreTokens()) {
            return;
        }
        long n = Long.parseLong(tokens.nextToken());
        if (!tokens.hasMoreTokens()) {
            return;
        }
        long k = Long.parseLong(tokens.nextToken());
        if (n < 1 || n > 1000000L || k < 1 || k > 1000000000L) {
            return;
        }

        long sum = 0;
        for (long i = 1; i * i <= n; i++) {
            if (n % i != 0) {
                continue;
            }
            sum = (sum + term(i, n, k)) % MODULO;
            if (i != n / i) {
                sum = (sum + term(n / i, n, k)) % MODULO;
            }
        }

        sum = sum * modPow(n, MODULO - 2) % MODULO;
        System.out.println(sum);
    }
}
