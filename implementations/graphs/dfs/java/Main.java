import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Depth-first search over an undirected graph read from standard input.
 *
 * <p>Input: n m, then m lines u v (0-based, undirected), then the start vertex.
 * Output: the number of vertices reachable from the start, then the reachable
 * vertices in increasing index order.
 */
public final class Main {

    private Main() {
    }

    /**
     * Depth-first search over an unweighted graph: the stack replaces the call
     * stack, so a chain of any length is traversed without recursion.
     *
     * @param adj    adjacency list; adj.get(v) holds the neighbors of v
     * @param source the start vertex
     * @return the visited vertices in visit order
     */
    public static List<Integer> dfsReachable(List<List<Integer>> adj, int source) {
        if (source < 0 || source >= adj.size()) {
            return new ArrayList<>();
        }

        final boolean[] visited = new boolean[adj.size()];
        final List<Integer> order = new ArrayList<>();
        final Deque<Integer> stack = new ArrayDeque<>();

        stack.push(source);
        while (!stack.isEmpty()) {
            final int v = stack.pop();
            if (visited[v]) {
                // The vertex was already reached through another edge.
                continue;
            }
            visited[v] = true;
            order.add(v);

            for (final int w : adj.get(v)) {
                if (!visited[w]) {
                    stack.push(w);
                }
            }
        }
        return order;
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
            System.out.println("0");
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

        final List<Integer> order = dfsReachable(adj, source);
        final boolean[] reachable = new boolean[n];
        for (final int v : order) {
            reachable[v] = true;
        }

        final StringBuilder line = new StringBuilder();
        for (int v = 0; v < n; v++) {
            if (!reachable[v]) {
                continue;
            }
            if (line.length() > 0) {
                line.append(' ');
            }
            line.append(v);
        }
        System.out.println(order.size());
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
