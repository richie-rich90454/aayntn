import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A binary-lifting table for a tree rooted at one vertex: up[k * n + v] is the
 * ancestor of v that lies 2^k edges above it, and depth[v] is the number of
 * edges from the root to v.
 *
 * The arrays belong to the Java heap, so the garbage collector reclaims them
 * and no explicit destroy call is needed.
 */
public final class Program {

    private Program() {
    }

    public static final class Lca {
        private final int n;
        private final int levels;
        private final int[] depth;
        private final int[] up;

        /**
         * @param adj  adjacency list; adj.get(v) lists the neighbors of the
         *   vertex v
         * @param root the root of the tree
         */
        public Lca(List<List<Integer>> adj, int root) {
            this.n = adj.size();
            int levelCount = 1;
            while ((1 << levelCount) <= n) {
                levelCount++;
            }
            this.levels = levelCount;
            this.depth = new int[n];
            this.up = new int[levels * n];
            Arrays.fill(depth, -1);
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
         * The ancestor of v that lies 2^k edges above it.
         */
        public int lift(int v, int k) {
            if (v < 0 || v >= n) {
                return -1;
            }
            if (k < 0) {
                k = 0;
            }
            if (k >= levels) {
                k = levels - 1;
            }
            return up[k * n + v];
        }

        /**
         * The number of edges from the root to v.
         */
        public int depth(int v) {
            if (v < 0 || v >= n) {
                return -1;
            }
            return depth[v];
        }

        /**
         * The lowest common ancestor of u and v.
         */
        public int query(int u, int v) {
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

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final List<List<Integer>> adj = new ArrayList<>();
        adj.add(Arrays.asList(1, 2));
        adj.add(Arrays.asList(0, 3, 4));
        adj.add(Arrays.asList(0));
        adj.add(Arrays.asList(1));
        adj.add(Arrays.asList(1));
        final Lca lca = new Lca(adj, 0);

        if (lca.query(3, 4) != 1) {
            throw new IllegalStateException("lca contract broken");
        }
        if (lca.query(2, 3) != 0) {
            throw new IllegalStateException("lca contract broken");
        }
        if (lca.query(0, 4) != 0) {
            throw new IllegalStateException("lca contract broken");
        }
        // A vertex is its own lowest common ancestor.
        if (lca.query(3, 3) != 3) {
            throw new IllegalStateException("lca contract broken");
        }

        if (lca.depth(0) != 0 || lca.depth(1) != 1 || lca.depth(3) != 2) {
            throw new IllegalStateException("lca contract broken");
        }
        if (lca.lift(3, 0) != 1 || lca.lift(3, 1) != 0) {
            throw new IllegalStateException("lca contract broken");
        }
    }
}
