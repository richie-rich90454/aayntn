import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;

/**
 * Pollard's rho with fixed constants x0 = 2 and c = 1, 2, 3, ... .
 *
 * <p>Input: t, then t positive integers below 2^63.
 * Output: one line per integer, holding its prime factors in ascending order.
 */
public final class Main {

    private static final int[] SMALL_PRIMES = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};

    private Main() {
    }

    /** (a * b) mod m, using BigInteger when the long product would overflow. */
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
        long base = a % m;
        while (e > 0) {
            if ((e & 1L) == 1L) {
                result = mulMod(result, base, m);
            }
            base = mulMod(base, base, m);
            e >>>= 1;
        }
        return result;
    }

    private static boolean isPrime(long n) {
        if (n < 2) {
            return false;
        }

        for (int p : SMALL_PRIMES) {
            if (n % p == 0) {
                return n == p;
            }
        }

        long d = n - 1;
        int s = 0;
        while ((d & 1L) == 0L) {
            d >>>= 1;
            s++;
        }

        for (int a : SMALL_PRIMES) {
            long x = powMod(a, d, n);
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

    private static long gcd(long a, long b) {
        while (b != 0) {
            long r = a % b;
            a = b;
            b = r;
        }
        return a;
    }

    private static long rhoStep(long x, long c, long n) {
        long square = mulMod(x, x, n);
        long add = c % n;
        return square >= n - add ? square - (n - add) : square + add;
    }

    private static long pollard(long n) {
        if (n % 2 == 0) {
            return 2;
        }
        if (n % 3 == 0) {
            return 3;
        }

        long c = 1;
        while (true) {
            long x = 2;
            long y = 2;
            long d = 1;
            while (d == 1) {
                x = rhoStep(x, c, n);
                y = rhoStep(rhoStep(y, c, n), c, n);
                long diff = x >= y ? x - y : y - x;
                d = gcd(diff, n);
            }
            if (d != n) {
                return d;
            }
            c++;
        }
    }

    private static ArrayList<Long> factorize(long n) {
        ArrayList<Long> factors = new ArrayList<>();
        if (n < 2) {
            return factors;
        }

        for (int p : SMALL_PRIMES) {
            while (n % p == 0) {
                factors.add((long) p);
                n /= p;
            }
        }

        ArrayDeque<Long> stack = new ArrayDeque<>();
        if (n > 1) {
            stack.push(n);
        }

        while (!stack.isEmpty()) {
            long m = stack.pop();
            if (isPrime(m)) {
                factors.add(m);
            } else {
                long d = pollard(m);
                stack.push(d);
                stack.push(m / d);
            }
        }

        Collections.sort(factors);
        return factors;
    }

    public static void main(String[] args) throws IOException {
        final Scanner scanner = new Scanner(System.in.readAllBytes());
        if (!scanner.hasNext()) {
            return;
        }

        final int count = (int) scanner.nextLong();
        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < count && scanner.hasNext(); i++) {
            final ArrayList<Long> factors = factorize(scanner.nextLong());
            for (int j = 0; j < factors.size(); j++) {
                if (j > 0) {
                    out.append(' ');
                }
                out.append(factors.get(j));
            }
            out.append('\n');
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
