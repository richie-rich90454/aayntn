import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * The lowest common ancestor of two vertices of a tree, read from standard
 * input.
 *
 * <p>Input: n m, then m lines u v with 0-based undirected edges, then q, then
 * q lines u v with the queried pair of vertices.
 * <p>Output: one line per query, holding the index of the lowest common
 * ancestor of the two vertices.
 */
public final class Main {

    private Main() {
    }

    /**
     * A binary-lifting table for a tree rooted at one vertex: up[k * n + v] is
     * the ancestor of v that lies 2^k edges above it, and depth[v] is the
     * number of edges from the root to v.
     *
     * The arrays belong to the Java heap, so the garbage collector reclaims
     * them and no explicit destroy call is needed.
     */
    private static final class Lca {
        private final int n;
        private final int levels;
        private final int[] depth;
        private final int[] up;

        /**
         * @param adj  adjacency list; adj.get(v) lists the neighbours of the
         *   vertex v
         * @param root the root of the tree
         */
        Lca(List<List<Integer>> adj, int root) {
            this.n = adj.size();
            int levelCount = 1;
            while ((1 << levelCount) <= n) {
                levelCount++;
            }
            this.levels = levelCount;
            this.depth = new int[n];
            this.up = new int[levels * n];
            java.util.Arrays.fill(depth, -1);
            if (n <= 0 || root < 0 || root >= n) {
                return;
            }

            // The root is its own ancestor, so the table stays defined everywhere.
            up[root] = root;
            depth[root] = 0;

            final int[] queue = new int[n];
            int head = 0;
            int tail = 0;
            queue[tail++] = root;
            while (head < tail) {
                final int u = queue[head++];
                for (final int w : adj.get(u)) {
                    if (depth[w] != -1) {
                        // The vertex was already reached through another edge.
                        continue;
                    }
                    depth[w] = depth[u] + 1;
                    up[w] = u;
                    queue[tail++] = w;
                }
            }

            // The table of the 2^k ancestors is built from the table of the 2^(k-1).
            for (int k = 1; k < levels; k++) {
                for (int v = 0; v < n; v++) {
                    final int middle = up[(k - 1) * n + v];
                    up[k * n + v] = up[(k - 1) * n + middle];
                }
            }
        }

        /**
         * The lowest common ancestor of u and v.
         */
        int query(int u, int v) {
            if (u < 0 || u >= n || v < 0 || v >= n) {
                return -1;
            }
            if (depth[u] < 0 || depth[v] < 0) {
                // A vertex outside the component of the root has no ancestor.
                return -1;
            }
            if (depth[u] < depth[v]) {
                final int swap = u;
                u = v;
                v = swap;
            }

            // Lift the deeper vertex until both stand at the same depth.
            final int difference = depth[u] - depth[v];
            for (int k = 0; k < levels; k++) {
                if (((difference >> k) & 1) != 0) {
                    u = up[k * n + u];
                }
            }
            if (u == v) {
                return u;
            }

            /*
             * From the largest jump downwards, the two vertices either stay
             * together or they both move one step below the common ancestor.
             */
            for (int k = levels - 1; k >= 0; k--) {
                final int ancestorU = up[k * n + u];
                final int ancestorV = up[k * n + v];
                if (ancestorU != ancestorV) {
                    u = ancestorU;
                    v = ancestorV;
                }
            }
            return up[u];
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        int n = (int) nToken;
        final int m = (int) mToken;
        if (n < 0) {
            n = 0;
        }

        final List<List<Integer>> adj = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }
        for (int i = 0; i < m; i++) {
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            if (uToken == Long.MIN_VALUE || vToken == Long.MIN_VALUE) {
                break;
            }
            final int u = (int) uToken;
            final int v = (int) vToken;
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        final Lca lca = new Lca(adj, 0);

        final long qToken = fs.nextLong();
        final int q = qToken == Long.MIN_VALUE ? 0 : (int) qToken;
        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            if (uToken == Long.MIN_VALUE || vToken == Long.MIN_VALUE) {
                break;
            }
            out.append(lca.query((int) uToken, (int) vToken)).append('\n');
        }
        // An explicit newline keeps the output identical on every platform.
        System.out.print(out.toString());
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
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    // Keep the buffer empty, so the next call reads again and
                    // reports the end of the input again.
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        /**
         * The next token as a number, or Long.MIN_VALUE when the input holds
         * no more tokens.
         */
        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return Long.MIN_VALUE;
            }
            boolean negative = false;
            if (c == '-') {
                negative = true;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return negative ? -value : value;
        }
    }
}
