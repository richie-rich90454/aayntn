import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.StringTokenizer;

/**
 * Reads a lattice polygon and prints twice its area, its boundary count and
 * its interior count.
 *
 * <p>The shoelace sum is kept as twice the signed area, so no division happens
 * until the interior count, where Pick's theorem guarantees the division is
 * exact. Each edge charges the gcd of its coordinate differences, which counts
 * its start vertex and its interior points but not its end.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final StringBuilder text = new StringBuilder();
        try (BufferedReader reader =
                new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            char[] buffer = new char[1 << 16];
            int read = reader.read(buffer);
            while (read > 0) {
                text.append(buffer, 0, read);
                read = reader.read(buffer);
            }
        }

        final StringTokenizer tokens = new StringTokenizer(text.toString());
        if (!tokens.hasMoreTokens()) {
            return;
        }

        final int n = Integer.parseInt(tokens.nextToken());
        if (n < 3) {
            return;
        }

        final long[] xs = new long[n];
        final long[] ys = new long[n];
        for (int i = 0; i < n; i++) {
            if (!tokens.hasMoreTokens()) {
                return;
            }
            xs[i] = Long.parseLong(tokens.nextToken());
            if (!tokens.hasMoreTokens()) {
                return;
            }
            ys[i] = Long.parseLong(tokens.nextToken());
        }

        long twiceArea = 0;
        long boundary = 0;
        for (int i = 0; i < n; i++) {
            final int j = (i + 1) % n;
            twiceArea += xs[i] * ys[j] - xs[j] * ys[i];
            boundary += gcd(xs[j] - xs[i], ys[j] - ys[i]);
        }

        twiceArea = Math.abs(twiceArea);
        final long interior = (twiceArea - boundary + 2) / 2;

        System.out.println(twiceArea);
        System.out.println(boundary);
        System.out.println(interior);
    }

    private static long gcd(long a, long b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b != 0) {
            final long remainder = a % b;
            a = b;
            b = remainder;
        }
        return a;
    }
}
