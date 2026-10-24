import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Maximum-weight spanning forest by Kruskal's algorithm.
 *
 * <p>Input: n, m, then m triples u v w describing an undirected edge of
 * weight w. Output: the total weight of a maximum-weight spanning forest.
 */
public final class Main {

    private static final class Edge {
        private final int u;
        private final int v;
        private final long weight;

        private Edge(int u, int v, long weight) {
            this.u = u;
            this.v = v;
            this.weight = weight;
        }
    }

    private Main() {
    }

    private static int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    private static boolean unite(int[] parent, int[] size, int a, int b) {
        int ra = find(parent, a);
        int rb = find(parent, b);
        if (ra == rb) {
            return false;
        }
        if (size[ra] < size[rb]) {
            final int temporary = ra;
            ra = rb;
            rb = temporary;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();
        final int n = scanner.nextInt();
        final int m = scanner.nextInt();
        if (n < 0 || m < 0) {
            return;
        }

        final Edge[] edges = new Edge[m];
        int count = 0;
        for (int k = 0; k < m; k++) {
            final int u = scanner.nextInt();
            final int v = scanner.nextInt();
            final long weight = scanner.nextLong();
            edges[count] = new Edge(u - 1, v - 1, weight);
            count += 1;
        }

        if (n < 1) {
            System.out.println(0);
            return;
        }

        Arrays.sort(edges, 0, count, (a, b) -> Long.compare(b.weight, a.weight));

        final int[] parent = new int[n];
        final int[] size = new int[n];
        for (int k = 0; k < n; k++) {
            parent[k] = k;
            size[k] = 1;
        }

        long total = 0;
        for (int k = 0; k < count; k++) {
            if (unite(parent, size, edges[k].u, edges[k].v)) {
                total += edges[k].weight;
            }
        }

        final StringBuilder out = new StringBuilder();
        out.append(total).append(System.lineSeparator());
        System.out.print(out);
    }

    /**
     * Token scanner over standard input, because java.util.Scanner is slow on
     * inputs with hundreds of thousands of edges.
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
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++] & 0xFF;
        }

        int nextInt() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            final boolean negative = c == '-';
            if (negative) {
                c = readByte();
            }
            int value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return negative ? -value : value;
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
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
