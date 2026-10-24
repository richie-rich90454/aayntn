import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Euler's recurrence for the partition function, driven from standard input.
 *
 * <p>Input: one integer n. Output: p(n) modulo 1000000007.
 */
public final class Main {

    private static final long MODULUS = 1000000007L;

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        while (line != null && line.trim().isEmpty()) {
            line = reader.readLine();
        }
        if (line == null) {
            return;
        }

        final int n = Integer.parseInt(line.trim().split("\\s+")[0]);
        if (n < 0) {
            return;
        }

        final int[] partitions = new int[n + 1];
        partitions[0] = 1;

        for (int i = 1; i <= n; i++) {
            long total = 0;
            for (int k = 1;; k++) {
                final long first = (long) k * (3L * k - 1) / 2;
                if (first > i) {
                    break;
                }
                final long second = (long) k * (3L * k + 1) / 2;
                if ((k & 1) == 1) {
                    total += partitions[(int) (i - first)];
                    if (total >= MODULUS) {
                        total -= MODULUS;
                    }
                    if (second <= i) {
                        total += partitions[(int) (i - second)];
                        if (total >= MODULUS) {
                            total -= MODULUS;
                        }
                    }
                } else {
                    total -= partitions[(int) (i - first)];
                    if (total < 0) {
                        total += MODULUS;
                    }
                    if (second <= i) {
                        total -= partitions[(int) (i - second)];
                        if (total < 0) {
                            total += MODULUS;
                        }
                    }
                }
            }
            partitions[i] = (int) total;
        }

        System.out.println(partitions[n]);
    }
}
