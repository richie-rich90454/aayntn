import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * The sum of the values on a path of a tree, read from standard input.
 *
 * <p>Input: n m, then m lines u v with 0-based undirected edges, then q, then
 * q lines u v with the queried pair of vertices.
 * <p>Output: one line per query, holding the sum of the values of the
 * vertices on the path, both endpoints included. The value of the vertex i
 * is i + 1.
 */
public final class Main {

    private Main() {
    }

    /**
     * A heavy-light decomposition of a tree rooted at one vertex: size holds
     * the number of vertices in the subtree of a vertex, heavy the child with
     * the largest subtree, head the top of the chain of a vertex and pos its
     * index in the flattened array.
     *
     * The arrays belong to the Java heap, so the garbage collector reclaims
     * them and no explicit destroy call is needed.
     */
    private static final class Hld {
        private final int n;
        private final int[] parent;
        private final int[] depth;
        private final int[] size;
        private final int[] heavy;
        private final int[] head;
        private final int[] pos;
        private final long[] flat;
        private final long[] prefix;

        /**
         * @param adj    adjacency list; adj.get(v) lists the neighbours of the
         *   vertex v
         * @param root   the root of the tree
         * @param values the value of every vertex, so values[v] is the value of
         *   the vertex v
         */
        Hld(List<List<Integer>> adj, int root, long[] values) {
            this.n = adj.size();
            this.parent = new int[n];
            this.depth = new int[n];
            this.size = new int[n];
            this.heavy = new int[n];
            this.head = new int[n];
            this.pos = new int[n];
            this.flat = new long[n];
            this.prefix = new long[n + 1];
            Arrays.fill(depth, -1);
            Arrays.fill(size, 1);
            Arrays.fill(heavy, -1);
            if (n <= 0 || root < 0 || root >= n) {
                return;
            }

            // A breadth-first walk from the root fixes the parents and the depths.
            parent[root] = root;
            depth[root] = 0;
            final int[] order = new int[n];
            int headIndex = 0;
            int tail = 0;
            order[tail++] = root;
            while (headIndex < tail) {
                final int u = order[headIndex++];
                for (final int w : adj.get(u)) {
                    if (depth[w] != -1) {
                        // The vertex was already reached through another edge.
                        continue;
                    }
                    depth[w] = depth[u] + 1;
                    parent[w] = u;
                    order[tail++] = w;
                }
            }

            /*
             * The subtree sizes are known from the leaves upwards, and the
             * heavy child of a vertex is the child with the largest subtree.
             */
            for (int i = tail - 1; i >= 0; i--) {
                final int u = order[i];
                for (final int w : adj.get(u)) {
                    if (w == u || parent[w] != u) {
                        // The vertex is not a child of u.
                        continue;
                    }
                    size[u] += size[w];
                    final int current = heavy[u];
                    if (current == -1 || size[w] > size[current]) {
                        heavy[u] = w;
                    }
                }
            }

            /*
             * The flattened array holds one chain after the other, so the
             * vertices of a chain occupy a contiguous range of indices.
             */
            int timer = 0;
            for (int i = 0; i < tail; i++) {
                final int v = order[i];
                if (v != root && heavy[parent[v]] == v) {
                    // The vertex continues the chain of its parent.
                    continue;
                }
                for (int u = v; u != -1; u = heavy[u]) {
                    head[u] = v;
                    pos[u] = timer;
                    flat[timer] = values[u];
                    timer++;
                }
            }

            /*
             * The prefix sums turn every chain segment into a single
             * subtraction, so a path query costs one step per chain instead
             * of a segment tree walk.
             */
            for (int i = 0; i < n; i++) {
                prefix[i + 1] = prefix[i] + flat[i];
            }
        }

        /**
         * The sum of the values of the vertices on the path from u to v.
         */
        long pathSum(int u, int v) {
            if (u < 0 || u >= n || v < 0 || v >= n) {
                return 0;
            }
            if (depth[u] < 0 || depth[v] < 0) {
                // A vertex outside the component of the root lies on no path.
                return 0;
            }

            long total = 0;
            while (head[u] != head[v]) {
                if (depth[head[u]] < depth[head[v]]) {
                    final int swap = u;
                    u = v;
                    v = swap;
                }
                // The chain of u is a contiguous range of the flattened array.
                final int top = head[u];
                total += prefix[pos[u] + 1] - prefix[pos[top]];
                u = parent[top];
            }
            if (depth[u] > depth[v]) {
                final int swap = u;
                u = v;
                v = swap;
            }
            total += prefix[pos[v] + 1] - prefix[pos[u]];
            return total;
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

        // The value of the vertex i is i + 1, so the vertex 0 has the value 1.
        final long[] values = new long[n];
        for (int v = 0; v < n; v++) {
            values[v] = v + 1L;
        }

        final Hld hld = new Hld(adj, 0, values);

        final long qToken = fs.nextLong();
        final int q = qToken == Long.MIN_VALUE ? 0 : (int) qToken;
        final StringBuilder out = new StringBuilder();
        for (int k = 0; k < q; k++) {
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            if (uToken == Long.MIN_VALUE || vToken == Long.MIN_VALUE) {
                break;
            }
            out.append(hld.pathSum((int) uToken, (int) vToken)).append('\n');
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
