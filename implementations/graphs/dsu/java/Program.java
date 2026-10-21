/**
 * A disjoint set over the elements 0..n-1.
 *
 * <p>Union by size keeps the trees shallow and path compression flattens them,
 * so the two together make every operation take amortised constant time.
 */
public final class Program {

    private Program() {
    }

    /**
     * A disjoint set over the elements 0..n-1: parent holds the representative
     * of every element and size holds the number of elements of the set it
     * represents.
     *
     * <p>The arrays live on the heap and the garbage collector reclaims them.
     */
    public static final class DisjointSet {
        private final int[] parent;
        private final int[] size;

        public DisjointSet(int n) {
            final int count = n > 0 ? n : 0;
            this.parent = new int[count];
            this.size = new int[count];
            for (int i = 0; i < count; i++) {
                parent[i] = i;
                size[i] = 1;
            }
        }

        /**
         * The representative of the set holding x, compressing the path to it.
         */
        public int find(int x) {
            int root = x;
            while (parent[root] != root) {
                root = parent[root];
            }
            // Every element on the path now points at the root.
            while (parent[x] != x) {
                final int next = parent[x];
                parent[x] = root;
                x = next;
            }
            return root;
        }

        /**
         * Merges the sets holding a and b.
         */
        public void unite(int a, int b) {
            int rootA = find(a);
            int rootB = find(b);
            if (rootA == rootB) {
                return;
            }
            // The larger set absorbs the smaller one, which keeps the trees shallow.
            if (size[rootA] < size[rootB]) {
                final int swap = rootA;
                rootA = rootB;
                rootB = swap;
            }
            parent[rootB] = rootA;
            size[rootA] += size[rootB];
        }

        /**
         * Whether a and b belong to the same set.
         */
        public boolean same(int a, int b) {
            return find(a) == find(b);
        }
    }

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final DisjointSet set = new DisjointSet(5);

        set.unite(0, 1);
        set.unite(2, 3);
        if (!set.same(0, 1)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (set.same(0, 2)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (set.same(0, 3)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (set.find(0) != set.find(1)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (set.find(0) == set.find(2)) {
            throw new IllegalStateException("disjoint set contract broken");
        }

        set.unite(1, 3);
        if (!set.same(0, 3)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (!set.same(2, 3)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
        if (set.same(0, 4)) {
            throw new IllegalStateException("disjoint set contract broken");
        }
    }
}
