import java.io.IOException;
import java.io.InputStream;

/**
 * A disjoint set over the elements 0..n-1, driven by the operations read from
 * standard input.
 *
 * <p>Input: n q, then q operations. "1 u v" merges the sets of u and v and
 * "2 u v" queries whether u and v are in the same set.
 * Output: one line per query, holding yes or no.
 */
public final class Main {

    private Main() {
    }

    /**
     * A disjoint set over the elements 0..n-1: parent holds the representative
     * of every element and size holds the number of elements of the set it
     * represents.
     *
     * <p>Union by size keeps the trees shallow and path compression flattens
     * them, so the two together make every operation take amortised constant
     * time.
     */
    private static final class DisjointSet {
        private final int[] parent;
        private final int[] size;

        DisjointSet(int n) {
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
        int find(int x) {
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
        void unite(int a, int b) {
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
        boolean same(int a, int b) {
            return find(a) == find(b);
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long qToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || qToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        int q = (int) qToken;
        if (q < 0) {
            q = 0;
        }

        final DisjointSet set = new DisjointSet(n);
        final StringBuilder out = new StringBuilder();

        for (int i = 0; i < q; i++) {
            final long typeToken = fs.nextLong();
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            if (typeToken == Long.MIN_VALUE || uToken == Long.MIN_VALUE ||
                    vToken == Long.MIN_VALUE) {
                break;
            }
            final int type = (int) typeToken;
            final int u = (int) uToken;
            final int v = (int) vToken;
            final boolean valid = u >= 0 && u < n && v >= 0 && v < n;
            if (type == 1) {
                if (valid) {
                    set.unite(u, v);
                }
            } else if (type == 2) {
                out.append(valid && set.same(u, v) ? "yes\n" : "no\n");
            }
        }

        // An explicit line feed keeps the output identical on every platform.
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
