import java.util.Scanner;

/**
 * Euler's totient function driver.
 *
 * <p>Reads n, m and a, then prints phi(n) on the first line and a^phi(m) mod m
 * on the second. The exponent is at most m - 1, so every product stays below
 * m * m and a signed 64-bit integer holds it for the stated bounds.
 */
public final class Main {

    private Main() {
    }

    public static void main(final String[] args) {
        final Scanner scanner = new Scanner(System.in);
        final long n = scanner.nextLong();
        final long m = scanner.nextLong();
        final long a = scanner.nextLong();

        System.out.println(phi(n));
        System.out.println(modPow(a, phi(m), m));
    }

    private static long phi(final long n) {
        long result = n;
        long rest = n;

        for (long p = 2; p * p <= rest; p += 1) {
            if (rest % p == 0) {
                while (rest % p == 0) {
                    rest /= p;
                }
                result -= result / p;
            }
        }
        if (rest > 1) {
            result -= result / rest;
        }
        return result;
    }

    private static long modPow(final long base, final long exponent, final long modulus) {
        long result = 1 % modulus;
        long square = base % modulus;
        long remaining = exponent;

        while (remaining > 0) {
            if ((remaining & 1L) == 1L) {
                result = result * square % modulus;
            }
            square = square * square % modulus;
            remaining >>= 1;
        }
        return result;
    }
}
