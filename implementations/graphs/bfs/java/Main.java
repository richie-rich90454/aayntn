import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Breadth-first search over an undirected graph read from standard input.
 *
 * <p>Input: n m, then m lines u v (0-based, undirected), then the start vertex.
 * Output: the distance from the start vertex to every vertex, separated by
 * spaces, and -1 for the vertices the start cannot reach.
 */
public final class Main {

    private Main() {
    }

    /**
     * Breadth-first search from source over an unweighted graph.
     *
     * <p>The queue holds the frontier, so the vertices leave it in order of
     * increasing distance from source: the first time a vertex is discovered
     * its distance is already the length of a shortest path to it.
     *
     * @param adj    adjacency list; adj.get(v) holds the neighbours of v
     * @param source the start vertex
     * @return the distance from source to every vertex, -1 when unreachable
     */
    public static int[] bfsDistances(List<List<Integer>> adj, int source) {
        final int[] distance = new int[adj.size()];
        for (int v = 0; v < distance.length; v++) {
            distance[v] = -1;
        }
        if (source < 0 || source >= distance.length) {
            return distance;
        }

        final Deque<Integer> queue = new ArrayDeque<>();
        queue.add(source);
        distance[source] = 0;

        while (!queue.isEmpty()) {
            final int v = queue.poll();
            for (final int w : adj.get(v)) {
                if (distance[w] >= 0) {
                    // The vertex was already discovered.
                    continue;
                }
                distance[w] = distance[v] + 1;
                queue.add(w);
            }
        }
        return distance;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = fs.nextInt();
        final int m = fs.nextInt();
        if (n < 0 || m < 0) {
            // The input holds fewer than the two header tokens.
            return;
        }
        if (n <= 0) {
            System.out.println();
            return;
        }

        final List<List<Integer>> adj = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
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
        final int source = fs.nextInt();

        final int[] distance = bfsDistances(adj, source);

        final StringBuilder line = new StringBuilder();
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                line.append(' ');
            }
            line.append(distance[v]);
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
