import java.io.IOException;
import java.io.InputStream;

public class Main {
    private static final long ROOT = 3;

    private static long modPow(long a, long e, long mod) {
        long result = 1;
        a %= mod;
        while (e > 0) {
            if ((e & 1L) == 1L) {
                result = result * a % mod;
            }
            a = a * a % mod;
            e >>= 1;
        }
        return result;
    }

    private static void ntt(long[] a, boolean invert, long mod) {
        final int n = a.length;
        for (int i = 1, j = 0; i < n; i++) {
            int bit = n >> 1;
            while ((j & bit) != 0) {
                j ^= bit;
                bit >>= 1;
            }
            j ^= bit;
            if (i < j) {
                final long t = a[i];
                a[i] = a[j];
                a[j] = t;
            }
        }

        for (int len = 2; len <= n; len <<= 1) {
            long wlen = modPow(ROOT, (mod - 1) / len, mod);
            if (invert) {
                wlen = modPow(wlen, mod - 2, mod);
            }
            final int half = len >> 1;
            for (int start = 0; start < n; start += len) {
                long w = 1;
                for (int k = 0; k < half; k++) {
                    final long u = a[start + k];
                    final long v = a[start + k + half] * w % mod;
                    a[start + k] = (u + v) % mod;
                    a[start + k + half] = (u - v + mod) % mod;
                    w = w * wlen % mod;
                }
            }
        }

        if (invert) {
            final long invN = modPow(n, mod - 2, mod);
            for (int i = 0; i < n; i++) {
                a[i] = a[i] * invN % mod;
            }
        }
    }

    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int length = 0;
        private int position = 0;

        private int read() {
            if (position >= length) {
                try {
                    length = in.read(buffer);
                } catch (IOException error) {
                    length = -1;
                }
                position = 0;
                if (length <= 0) {
                    return -1;
                }
            }
            return buffer[position++] & 0xFF;
        }

        long nextLong() {
            int c = read();
            while (c <= ' ' && c >= 0) {
                c = read();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = read();
            }
            return value;
        }
    }

    public static void main(String[] args) {
        final FastScanner scanner = new FastScanner();
        final int n = (int) scanner.nextLong();
        final int m = (int) scanner.nextLong();
        final long mod = scanner.nextLong();
        if (n <= 0 || m <= 0) {
            return;
        }

        final int total = n + m - 1;
        int size = 1;
        while (size < total) {
            size <<= 1;
        }

        final long[] a = new long[size];
        final long[] b = new long[size];
        for (int i = 0; i < n; i++) {
            a[i] = scanner.nextLong() % mod;
        }
        for (int i = 0; i < m; i++) {
            b[i] = scanner.nextLong() % mod;
        }

        ntt(a, false, mod);
        ntt(b, false, mod);
        for (int i = 0; i < size; i++) {
            a[i] = a[i] * b[i] % mod;
        }
        ntt(a, true, mod);

        final StringBuilder output = new StringBuilder();
        for (int i = 0; i < total; i++) {
            if (i > 0) {
                output.append(' ');
            }
            output.append(a[i]);
        }
        System.out.println(output);
    }
}
