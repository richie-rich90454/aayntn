import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * The total weight of the virtual tree of the marked vertices of a rooted
 * weighted tree.
 *
 * <p>Input: n m, then m lines u v w with 0-based undirected weighted edges,
 * then q, then q lines k a1 ... ak with the marked vertices.
 * <p>Output: one line per query with the total weight of the virtual tree's
 * edges. The root is the vertex 0, duplicate marks count once, and a mark
 * outside the tree or outside the root's component is ignored.
 */
public final class Main {

    private Main() {
    }

    /**
     * A binary-lifting table over a rooted weighted tree. depth[v] counts
     * edges, distance[v] sums edge weights, and tin/tout delimit the subtree
     * of v in preorder.
     */
    private static final class Tree {
        private int n;
        private int levels;
        private int[] parent;
        private int[] depth;
        private int[] tin;
        private int[] tout;
        private long[] distance;
        private int[] up;

        void build(int vertexCount, int[] head, int[] to, int[] next, long[] weight) {
            n = vertexCount;
            levels = 1;
            while ((1 << levels) <= n) {
                levels++;
            }
            parent = new int[n];
            depth = new int[n];
            tin = new int[n];
            tout = new int[n];
            distance = new long[n];
            up = new int[levels * n];
            Arrays.fill(parent, -1);
            Arrays.fill(depth, -1);
            Arrays.fill(tin, -1);
            Arrays.fill(tout, -1);
            if (n <= 0) {
                return;
            }

            final int[] cursor = Arrays.copyOf(head, n);
            final int[] stack = new int[n];
            parent[0] = 0;
            depth[0] = 0;
            tin[0] = 0;
            int timer = 1;
            int top = 0;
            stack[0] = 0;
            while (top >= 0) {
                final int v = stack[top];
                int e = cursor[v];
                while (e != -1 && parent[to[e]] != -1) {
                    e = next[e];
                }
                cursor[v] = e;
                if (e == -1) {
                    tout[v] = timer;
                    top--;
                    continue;
                }
                cursor[v] = next[e];
                final int u = to[e];
                parent[u] = v;
                depth[u] = depth[v] + 1;
                distance[u] = distance[v] + weight[e];
                tin[u] = timer;
                timer++;
                top++;
                stack[top] = u;
            }

            // The root is its own ancestor, so every entry of the table is defined.
            for (int v = 0; v < n; v++) {
                up[v] = parent[v] >= 0 ? parent[v] : v;
            }
            for (int k = 1; k < levels; k++) {
                for (int v = 0; v < n; v++) {
                    final int middle = up[(k - 1) * n + v];
                    up[k * n + v] = up[(k - 1) * n + middle];
                }
            }
        }

        int lca(int u, int v) {
            if (u < 0 || u >= n || v < 0 || v >= n) {
                return -1;
            }
            if (depth[u] < 0 || depth[v] < 0) {
                return -1;
            }
            if (depth[u] < depth[v]) {
                final int swap = u;
                u = v;
                v = swap;
            }
            int difference = depth[u] - depth[v];
            for (int k = 0; difference > 0; k++) {
                if ((difference & 1) != 0) {
                    u = up[k * n + u];
                }
                difference >>= 1;
            }
            if (u == v) {
                return u;
            }
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

        boolean isAncestor(int u, int v) {
            return tin[u] <= tin[v] && tin[v] < tout[u];
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
        final int m = (int) Math.max(0L, mToken);
        if (n < 0) {
            n = 0;
        }

        final int[] head = new int[n];
        Arrays.fill(head, -1);
        final int[] to = new int[2 * m];
        final int[] next = new int[2 * m];
        final long[] weight = new long[2 * m];
        int edgeCount = 0;
        for (int i = 0; i < m; i++) {
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            final long wToken = fs.nextLong();
            if (uToken == Long.MIN_VALUE || vToken == Long.MIN_VALUE || wToken == Long.MIN_VALUE) {
                break;
            }
            final int u = (int) uToken;
            final int v = (int) vToken;
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            to[edgeCount] = v;
            weight[edgeCount] = wToken;
            next[edgeCount] = head[u];
            head[u] = edgeCount;
            edgeCount++;
            to[edgeCount] = u;
            weight[edgeCount] = wToken;
            next[edgeCount] = head[v];
            head[v] = edgeCount;
            edgeCount++;
        }

        final Tree tree = new Tree();
        tree.build(n, head, to, next, weight);

        final long qToken = fs.nextLong();
        final int q = qToken == Long.MIN_VALUE ? 0 : (int) Math.max(0L, qToken);
        final int[] stamp = new int[n];
        final long[] marks = new long[n];
        final long[] nodes = new long[2 * n + 1];
        final int[] stack = new int[2 * n + 1];
        final StringBuilder out = new StringBuilder();

        for (int query = 0; query < q; query++) {
            final long kToken = fs.nextLong();
            if (kToken == Long.MIN_VALUE) {
                break;
            }
            final int k = (int) Math.max(0L, kToken);
            final int queryId = query + 1;
            int count = 0;
            boolean complete = true;
            for (int i = 0; i < k; i++) {
                final long vToken = fs.nextLong();
                if (vToken == Long.MIN_VALUE) {
                    complete = false;
                    break;
                }
                final int v = (int) vToken;
                if (v >= 0 && v < n && tree.depth[v] >= 0 && stamp[v] != queryId) {
                    stamp[v] = queryId;
                    marks[count] = ((long) tree.tin[v] << 32) | (v & 0xffffffffL);
                    count++;
                }
            }
            if (!complete) {
                break;
            }
            if (count < 2) {
                out.append(0).append('\n');
                continue;
            }

            Arrays.sort(marks, 0, count);
            int totalNodes = count;
            System.arraycopy(marks, 0, nodes, 0, count);
            for (int i = 0; i + 1 < count; i++) {
                final int ancestor = tree.lca((int) marks[i], (int) marks[i + 1]);
                if (ancestor >= 0) {
                    nodes[totalNodes] =
                            ((long) tree.tin[ancestor] << 32) | (ancestor & 0xffffffffL);
                    totalNodes++;
                }
            }
            Arrays.sort(nodes, 0, totalNodes);

            int unique = 0;
            for (int i = 0; i < totalNodes; i++) {
                if (unique == 0 || nodes[i] != nodes[unique - 1]) {
                    nodes[unique] = nodes[i];
                    unique++;
                }
            }

            long total = 0;
            int top = 0;
            for (int i = 0; i < unique; i++) {
                final int v = (int) nodes[i];
                while (top > 0 && !tree.isAncestor(stack[top - 1], v)) {
                    top--;
                }
                if (top > 0) {
                    total += tree.distance[v] - tree.distance[stack[top - 1]];
                }
                stack[top] = v;
                top++;
            }
            out.append(total).append('\n');
        }

        // An explicit newline keeps the output identical on every platform.
        System.out.print(out.toString());
    }

    /** Token scanner over standard input; contest inputs are too large for Scanner. */
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
            final boolean negative = c == '-';
            if (negative) {
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
