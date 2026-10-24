import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * The minimal rotation of a string.
 *
 * <p>Input: one nonempty string without spaces, of length at most 10^6.
 * Output: the lexicographically smallest rotation of the string.
 *
 * <p>Two candidate start positions i and j advance through the string while k
 * counts the characters they agree on. When the candidates finally differ, the
 * loser and every start inside the matched block are eliminated at once, so
 * each character is compared a constant number of times.
 */
public final class Main {

    private Main() {
    }

    private static int leastRotation(String s) {
        final int n = s.length();
        int i = 0;
        int j = 1;
        int k = 0;

        while (i < n && j < n && k < n) {
            final char a = s.charAt((i + k) % n);
            final char b = s.charAt((j + k) % n);
            if (a == b) {
                k++;
            } else if (a > b) {
                i = i + k + 1;
                if (i <= j) {
                    i = j + 1;
                }
                k = 0;
            } else {
                j = j + k + 1;
                if (j <= i) {
                    j = i + 1;
                }
                k = 0;
            }
        }
        return i < j ? i : j;
    }

    public static void main(String[] args) throws IOException {
        final BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        final String line = reader.readLine();
        if (line == null) {
            return;
        }
        final String s = line.trim();
        final int n = s.length();
        if (n == 0) {
            System.out.println();
            return;
        }

        final int start = leastRotation(s);
        final StringBuilder out = new StringBuilder(n + 1);
        for (int t = 0; t < n; t++) {
            out.append(s.charAt((start + t) % n));
        }
        out.append('\n');
        System.out.print(out);
    }
}
