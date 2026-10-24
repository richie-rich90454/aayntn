import java.io.IOException;
import java.io.InputStream;

/**
 * Berlekamp-Massey over the prime field modulo 1000000007.
 *
 * <p>The program reads a prefix of a sequence and prints the order of its
 * shortest linear recurrence and the next term.
 */
public final class Main {

    private static final long MODULO = 1000000007L;

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();

        final int n = scanner.nextInt();
        if (n <= 0) {
            return;
        }

        final long[] sequence = new long[n];
        for (int i = 0; i < n; i++) {
            sequence[i] = scanner.nextLong() % MODULO;
            if (sequence[i] < 0) {
                sequence[i] += MODULO;
            }
        }

        final long[] current = new long[n + 1];
        long[] backup = new long[n + 1];
        long[] saved = new long[n + 1];
        current[0] = 1;
        backup[0] = 1;

        int currentLength = 1;
        int backupLength = 1;
        int order = 0;
        int shift = 1;
        long lastDiscrepancy = 1;

        for (int i = 0; i < n; i++) {
            long discrepancy = 0;
            final int limit = Math.min(order, i);
            for (int j = 0; j <= limit; j++) {
                discrepancy = (discrepancy + current[j] * sequence[i - j]) % MODULO;
            }
            if (discrepancy == 0) {
                shift++;
                continue;
            }

            System.arraycopy(current, 0, saved, 0, currentLength);
            final int savedLength = currentLength;
            final long coefficient =
                discrepancy * powerMod(lastDiscrepancy, MODULO - 2) % MODULO;

            if (currentLength < backupLength + shift) {
                for (int j = currentLength; j < backupLength + shift; j++) {
                    current[j] = 0;
                }
                currentLength = backupLength + shift;
            }
            for (int j = 0; j < backupLength; j++) {
                current[j + shift] =
                    (current[j + shift] - coefficient * backup[j] % MODULO + MODULO) % MODULO;
            }

            if (2 * order <= i) {
                order = i + 1 - order;
                final long[] temporary = backup;
                backup = saved;
                saved = temporary;
                backupLength = savedLength;
                lastDiscrepancy = discrepancy;
                shift = 1;
            } else {
                shift++;
            }
        }

        long nextTerm = 0;
        for (int j = 1; j <= order && j <= n; j++) {
            nextTerm = (nextTerm + current[j] * sequence[n - j]) % MODULO;
        }
        if (nextTerm != 0) {
            nextTerm = MODULO - nextTerm;
        }

        System.out.println(order + " " + nextTerm);
    }

    private static long powerMod(long base, long exponent) {
        long result = 1;
        long value = base % MODULO;
        while (exponent > 0) {
            if ((exponent & 1L) == 1L) {
                result = result * value % MODULO;
            }
            value = value * value % MODULO;
            exponent >>= 1;
        }
        return result;
    }

    /** Token scanner over standard input, faster than java.util.Scanner. */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++] & 0xFF;
        }

        int nextInt() throws IOException {
            return (int) nextLong();
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            final int sign = c == '-' ? -1 : 1;
            if (c == '-') {
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
