import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Aho-Corasick over the lowercase Latin alphabet, driven from standard input.
 *
 * <p>Input: n, then n patterns on separate lines, then the text on the last
 * line. Output: one line per pattern, holding the number of its occurrences in
 * the text, overlapping occurrences included.
 *
 * <p>The trie stores 26 transitions per node, all initialized to -1. The
 * failure links are built in breadth-first order, and a missing transition is
 * filled with the transition of the failure link, so the scan performs one
 * lookup per text character. The counters are then pushed up the failure tree
 * in reverse breadth-first order, which counts the occurrences without
 * enumerating them.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        int n = fs.nextInt();
        if (n < 0) {
            n = 0;
        }

        final String[] patterns = new String[n];
        int total = 0;
        for (int i = 0; i < n; i++) {
            final String pattern = fs.next();
            patterns[i] = pattern == null ? "" : pattern;
            total += patterns[i].length();
        }
        final String maybeText = fs.next();
        final String text = maybeText == null ? "" : maybeText;

        final int[][] go = new int[total + 1][26];
        for (int[] row : go) {
            Arrays.fill(row, -1);
        }
        final int[] fail = new int[total + 1];
        final long[] count = new long[total + 1];
        final int[] terminal = new int[n];
        final int[] order = new int[total + 1];

        // Insert every pattern, remembering the terminal node of each one.
        int nodes = 1;
        for (int i = 0; i < n; i++) {
            int v = 0;
            final String pattern = patterns[i];
            for (int j = 0; j < pattern.length(); j++) {
                final int c = pattern.charAt(j) - 'a';
                if (c < 0 || c >= 26) {
                    continue;
                }
                if (go[v][c] == -1) {
                    go[v][c] = nodes;
                    nodes++;
                }
                v = go[v][c];
            }
            terminal[i] = v;
        }

        // Build the failure links and complete the transition table.
        int head = 0;
        int tail = 0;
        for (int c = 0; c < 26; c++) {
            final int u = go[0][c];
            if (u == -1) {
                go[0][c] = 0;
            } else {
                fail[u] = 0;
                order[tail++] = u;
            }
        }
        while (head < tail) {
            final int v = order[head++];
            final int fv = fail[v];
            for (int c = 0; c < 26; c++) {
                final int u = go[v][c];
                if (u == -1) {
                    go[v][c] = go[fv][c];
                } else {
                    fail[u] = go[fv][c];
                    order[tail++] = u;
                }
            }
        }

        int state = 0;
        for (int j = 0; j < text.length(); j++) {
            final int c = text.charAt(j) - 'a';
            if (c < 0 || c >= 26) {
                continue;
            }
            state = go[state][c];
            count[state]++;
        }

        for (int i = tail - 1; i >= 0; i--) {
            final int v = order[i];
            count[fail[v]] += count[v];
        }

        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            out.append(count[terminal[i]]).append('\n');
        }
        System.out.print(out);
    }

    /**
     * Token scanner over standard input: contest inputs are far too large for
     * java.util.Scanner.
     */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer == available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        int nextInt() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = readByte();
            }
            int value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }

        String next() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return null;
            }
            final StringBuilder token = new StringBuilder();
            while (c != -1 && c > ' ') {
                token.append((char) c);
                c = readByte();
            }
            return token.toString();
        }
    }
}
