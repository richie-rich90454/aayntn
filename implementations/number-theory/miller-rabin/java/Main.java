import java.io.IOException;
import java.math.BigInteger;

/**
 * The Miller-Rabin primality test with the twelve deterministic 64-bit bases.
 *
 * <p>Input: t, then t non-negative integers below 2^63.
 * Output: one line per integer, holding PRIME or COMPOSITE.
 */
public final class Main {

    private static final int[] BASES = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};

    private Main() {
    }

    /**
     * (a * b) mod m. The long product is used whenever it cannot overflow, and
     * BigInteger supplies the missing 128 bits otherwise.
     */
    private static long mulMod(long a, long b, long m) {
        if (a == 0 || b <= Long.MAX_VALUE / a) {
            return (a * b) % m;
        }
        return BigInteger.valueOf(a)
                .multiply(BigInteger.valueOf(b))
                .mod(BigInteger.valueOf(m))
                .longValue();
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

    private static boolean isPrime(long n) {
        if (n < 2) {
            return false;
        }

        // Small factors are cheap, and they leave n > 37 and coprime to every base.
        for (int base : BASES) {
            if (n % base == 0) {
                return n == base;
            }
        }

        // Write n - 1 as 2^s * d with d odd.
        long d = n - 1;
        int s = 0;
        while ((d & 1L) == 0L) {
            d >>>= 1;
            s++;
        }

        for (int base : BASES) {
            long x = powMod(base, d, n);
            if (x == 1 || x == n - 1) {
                continue;
            }
            boolean passed = false;
            for (int r = 1; r < s; r++) {
                x = mulMod(x, x, n);
                if (x == n - 1) {
                    passed = true;
                    break;
                }
            }
            if (!passed) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) throws IOException {
        final Scanner scanner = new Scanner(System.in.readAllBytes());
        if (!scanner.hasNext()) {
            return;
        }

        final long count = scanner.nextLong();
        final StringBuilder out = new StringBuilder();
        for (long i = 0; i < count && scanner.hasNext(); i++) {
            final long value = scanner.nextLong();
            out.append(value >= 2 && isPrime(value) ? "PRIME\n" : "COMPOSITE\n");
        }
        System.out.print(out);
    }

    /** Token scanner over a byte array: contest inputs are too large for Scanner. */
    private static final class Scanner {
        private final byte[] data;
        private int index;

        Scanner(byte[] data) {
            this.data = data;
        }

        boolean hasNext() {
            while (index < data.length && data[index] <= ' ') {
                index++;
            }
            return index < data.length;
        }

        long nextLong() {
            hasNext();
            boolean negative = false;
            if (data[index] == '-') {
                negative = true;
                index++;
            }
            long value = 0;
            while (index < data.length && data[index] > ' ') {
                value = value * 10 + (data[index] - '0');
                index++;
            }
            return negative ? -value : value;
        }
    }
}
