import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * The two-coloring test for an undirected graph read from standard input.
 *
 * <p>Input: n m, then m lines u v (0-based, undirected).
 * Output: the color of every vertex, 0 or 1, separated by spaces, or the single
 * line -1 when the graph is not bipartite.
 */
public final class Main {

    private Main() {
    }

    /**
     * Two-colors an undirected graph, one connected component at a time.
     *
     * <p>A vertex receives the opposite color of the vertex that discovered
     * it, so its color is the parity of its breadth-first distance from the
     * root of its component. The test fails when an edge joins two vertices of
     * the same parity, because that edge closes an odd cycle.
     *
     * @param adj adjacency list; adj.get(v) holds the neighbors of v
     * @param color receives the color of every vertex, 0 or 1
     * @return true when the graph is bipartite and false otherwise
     */
    public static boolean twoColor(List<List<Integer>> adj, int[] color) {
        final int n = adj.size();
        for (int v = 0; v < n; v++) {
            color[v] = -1;
        }

        final Deque<Integer> queue = new ArrayDeque<>();
        for (int s = 0; s < n; s++) {
            if (color[s] != -1) {
                // This component was already colored.
                continue;
            }
            color[s] = 0;
            queue.clear();
            queue.add(s);

            while (!queue.isEmpty()) {
                final int u = queue.poll();
                for (final int v : adj.get(u)) {
                    if (color[v] == -1) {
                        color[v] = color[u] ^ 1;
                        queue.add(v);
                    } else if (color[v] == color[u]) {
                        // The edge closes an odd cycle.
                        return false;
                    }
                }
            }
        }
        return true;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = fs.nextInt();
        final int m = fs.nextInt();
        if (n < 0 || m < 0) {
            // The input holds fewer than the two header tokens.
            return;
        }
        if (n == 0) {
            System.out.println();
            return;
        }

        final List<List<Integer>> adj = new ArrayList<>(n);
        for (int v = 0; v < n; v++) {
            adj.add(new ArrayList<>());
        }
        for (int i = 0; i < m; i++) {
            final int u = fs.nextInt();
            final int v = fs.nextInt();
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        final int[] color = new int[n];
        if (!twoColor(adj, color)) {
            System.out.println(-1);
            return;
        }

        final StringBuilder line = new StringBuilder();
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                line.append(' ');
            }
            line.append(color[v]);
        }
        System.out.println(line);
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
                pointer = 0;
                available = in.read(buffer);
                if (available <= 0) {
                    // End of input: leave the buffer empty so that the next call
                    // retries the read instead of walking off the end of it.
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        /** Returns the next integer, or -1 when the input holds no more tokens. */
        int nextInt() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return -1;
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
    }
}
