import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.StringTokenizer;

/**
 * Reads triples of integer points and prints the exact orientation sign of
 * each triple.
 *
 * <p>The sign is the sign of the cross product of B - A and C - A. The
 * coordinates have absolute value at most 10^6, so every product is at most
 * 4 * 10^12 and the cross product is at most 8 * 10^12, which fits in a long
 * with no rounding.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final StringBuilder text = new StringBuilder();
        try (BufferedReader reader =
                new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            final char[] buffer = new char[1 << 16];
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

        final int q = Integer.parseInt(tokens.nextToken());
        if (q <= 0) {
            return;
        }

        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < q; i++) {
            if (!tokens.hasMoreTokens()) {
                return;
            }
            final long ax = Long.parseLong(tokens.nextToken());
            final long ay = Long.parseLong(tokens.nextToken());
            final long bx = Long.parseLong(tokens.nextToken());
            final long by = Long.parseLong(tokens.nextToken());
            final long cx = Long.parseLong(tokens.nextToken());
            final long cy = Long.parseLong(tokens.nextToken());

            final long ux = bx - ax;
            final long uy = by - ay;
            final long vx = cx - ax;
            final long vy = cy - ay;
            final long d = ux * vy - uy * vx;

            out.append(d > 0 ? 1 : (d < 0 ? -1 : 0)).append('\n');
        }
        System.out.print(out);
    }
}
