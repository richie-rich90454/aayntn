import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A heavy-light decomposition of a tree rooted at one vertex: size holds the
 * number of vertices in the subtree of a vertex, heavy the child with the
 * largest subtree, head the top of the chain of a vertex and pos its index in
 * the flattened array.
 *
 * The arrays belong to the Java heap, so the garbage collector reclaims them
 * and no explicit destroy call is needed.
 */
public final class Program {

    private Program() {
    }

    public static final class Hld {
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
        public Hld(List<List<Integer>> adj, int root, long[] values) {
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
         * The number of vertices in the subtree of v.
         */
        public int subtreeSize(int v) {
            if (v < 0 || v >= n) {
                return 0;
            }
            return size[v];
        }

        /**
         * The child of v with the largest subtree, or -1 when v is a leaf.
         */
        public int heavyChild(int v) {
            if (v < 0 || v >= n) {
                return -1;
            }
            return heavy[v];
        }

        /**
         * The top of the chain of v.
         */
        public int chainHead(int v) {
            if (v < 0 || v >= n) {
                return -1;
            }
            return head[v];
        }

        /**
         * The index of v in the flattened array.
         */
        public int position(int v) {
            if (v < 0 || v >= n) {
                return -1;
            }
            return pos[v];
        }

        /**
         * The sum of the values of the vertices on the path from u to v.
         */
        public long pathSum(int u, int v) {
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

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        // The tree 0-1, 1-2, 1-3 with the value of the vertex i equal to i + 1.
        final List<List<Integer>> adj = new ArrayList<>();
        adj.add(Arrays.asList(1));
        adj.add(Arrays.asList(0, 2, 3));
        adj.add(Arrays.asList(1));
        adj.add(Arrays.asList(1));
        final Hld hld = new Hld(adj, 0, new long[] {1, 2, 3, 4});

        if (hld.subtreeSize(0) != 4 || hld.subtreeSize(1) != 3 ||
            hld.subtreeSize(2) != 1 || hld.subtreeSize(3) != 1) {
            throw new IllegalStateException("decomposition contract broken");
        }
        if (hld.heavyChild(0) != 1 || hld.heavyChild(1) != 2) {
            throw new IllegalStateException("decomposition contract broken");
        }

        if (hld.pathSum(2, 3) != 9L) {
            throw new IllegalStateException("decomposition contract broken");
        }
        if (hld.pathSum(0, 3) != 7L) {
            throw new IllegalStateException("decomposition contract broken");
        }
        // The path of a vertex with itself holds that vertex alone.
        if (hld.pathSum(0, 0) != 1L) {
            throw new IllegalStateException("decomposition contract broken");
        }
        if (hld.pathSum(1, 1) != 2L) {
            throw new IllegalStateException("decomposition contract broken");
        }
    }
}
