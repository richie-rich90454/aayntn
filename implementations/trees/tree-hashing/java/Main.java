import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.StringTokenizer;

public class Main {
    private static final long BASE_FIRST = 1000003L;
    private static final long BASE_SECOND = 999983L;
    private static final long MASK = 0xFFFFFFFFL;

    private static final class FastScanner {
        private final BufferedReader reader =
                new BufferedReader(new InputStreamReader(System.in));
        private StringTokenizer tokenizer = new StringTokenizer("");

        int nextInt() throws IOException {
            while (!tokenizer.hasMoreTokens()) {
                final String line = reader.readLine();
                if (line == null) {
                    return Integer.MIN_VALUE;
                }
                tokenizer = new StringTokenizer(line);
            }
            return Integer.parseInt(tokenizer.nextToken());
        }
    }

    private static final class TreeHash {
        int n;
        int root;
        int[] start;
        int[] children;
        long[] first;
        long[] second;
    }

    private static int mixFirst(int value) {
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        return value;
    }

    private static int mixSecond(int value) {
        value += 0x9E3779B9;
        value ^= value << 5;
        value ^= value >>> 13;
        value ^= value << 17;
        return value;
    }

    private static TreeHash readTree(FastScanner in, int n) throws IOException {
        final int[] parent = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = in.nextInt();
        }

        int root = -1;
        for (int i = 0; i < n; i++) {
            if (parent[i] < 0 || parent[i] >= n) {
                parent[i] = -1;
                if (root < 0) {
                    root = i;
                }
            }
        }
        if (root < 0) {
            root = 0;
            parent[0] = -1;
        }

        final int[] count = new int[n];
        for (int i = 0; i < n; i++) {
            if (i != root && parent[i] >= 0) {
                count[parent[i]]++;
            }
        }

        final int[] start = new int[n + 1];
        for (int i = 0; i < n; i++) {
            start[i + 1] = start[i] + count[i];
        }

        final int[] children = new int[n > 1 ? n - 1 : 1];
        final int[] cursor = new int[n];
        for (int i = 0; i < n; i++) {
            if (i != root && parent[i] >= 0) {
                final int p = parent[i];
                children[start[p] + cursor[p]] = i;
                cursor[p]++;
            }
        }

        final int[] order = new int[n];
        int orderCount = 0;
        order[orderCount++] = root;
        for (int head = 0; head < orderCount; head++) {
            final int u = order[head];
            for (int e = start[u]; e < start[u + 1]; e++) {
                order[orderCount++] = children[e];
            }
        }

        final long[] first = new long[n];
        final long[] second = new long[n];
        final long[] keys = new long[n];

        for (int index = orderCount - 1; index >= 0; index--) {
            final int u = order[index];
            int degree = 0;
            for (int e = start[u]; e < start[u + 1]; e++) {
                final int c = children[e];
                /*
                 * Flipping the sign bit makes the signed sort of the packed
                 * pair agree with the unsigned lexicographic order.
                 */
                final long packed = (first[c] << 32) | second[c];
                keys[degree++] = packed ^ Long.MIN_VALUE;
            }
            Arrays.sort(keys, 0, degree);

            long foldFirst = 0;
            long foldSecond = 0;
            for (int i = 0; i < degree; i++) {
                final long packed = keys[i] ^ Long.MIN_VALUE;
                final long childFirst = packed >>> 32;
                final long childSecond = packed & MASK;
                foldFirst =
                        (foldFirst * BASE_FIRST + ((long) mixFirst((int) childFirst) & MASK))
                                & MASK;
                foldSecond =
                        (foldSecond * BASE_SECOND + ((long) mixSecond((int) childSecond) & MASK))
                                & MASK;
            }
            first[u] = (foldFirst * BASE_FIRST + 1) & MASK;
            second[u] = (foldSecond * BASE_SECOND + 1) & MASK;
        }

        final TreeHash tree = new TreeHash();
        tree.n = n;
        tree.root = root;
        tree.start = start;
        tree.children = children;
        tree.first = first;
        tree.second = second;
        return tree;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner in = new FastScanner();

        final int n = in.nextInt();
        if (n < 1) {
            System.out.println("DIFFERENT");
            return;
        }
        final TreeHash firstTree = readTree(in, n);

        final int m = in.nextInt();
        if (m < 1) {
            System.out.println("DIFFERENT");
            return;
        }
        final TreeHash secondTree = readTree(in, m);

        final boolean same = firstTree.n == secondTree.n
                && firstTree.first[firstTree.root] == secondTree.first[secondTree.root]
                && firstTree.second[firstTree.root] == secondTree.second[secondTree.root];
        System.out.println(same ? "SAME" : "DIFFERENT");
    }
}
