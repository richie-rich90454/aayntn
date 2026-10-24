import java.io.IOException;
import java.io.InputStream;

/**
 * Johnson's algorithm over a directed weighted graph read from standard input.
 *
 * <p>Input: n m, then m lines u v w (0-based, directed, integer weight). The
 * input ends after the edges.
 * Output: n lines of n integers, where the j-th number of the i-th line is the
 * shortest distance from i to j, and -1 when j is unreachable from i. A graph
 * with a negative cycle prints the single line {@code NEGATIVE CYCLE} instead.
 */
public final class Main {

    /*
     * Larger than any shortest path this program can build from two finite
     * values, so the guarded addition below cannot overflow a 64-bit integer.
     */
    private static final long INFINITY = 4_000_000_000_000_000_000L;

    private int n;
    private int edgeCount;
    private int[] edgeFrom;
    private int[] edgeTo;
    private long[] edgeWeight;

    private int[] head;
    private int[] next;
    private int[] arcTo;
    private long[] arcWeight;

    private long[] heapKey;
    private int[] heapVertex;
    private int heapSize;

    private Main(int vertexCount, int edgeCapacity) {
        n = vertexCount;
        edgeFrom = new int[edgeCapacity];
        edgeTo = new int[edgeCapacity];
        edgeWeight = new long[edgeCapacity];
        head = new int[vertexCount];
        next = new int[edgeCapacity];
        arcTo = new int[edgeCapacity];
        arcWeight = new long[edgeCapacity];
        heapKey = new long[edgeCapacity + vertexCount + 1];
        heapVertex = new int[edgeCapacity + vertexCount + 1];
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        int m = (int) mToken;
        if (n <= 0) {
            System.out.print("\n");
            return;
        }
        if (m < 0) {
            m = 0;
        }

        final Main solver = new Main(n, m + 1);
        for (int e = 0; e < m; e++) {
            final long uToken = fs.nextLong();
            final long vToken = fs.nextLong();
            final long w = fs.nextLong();
            if (uToken == Long.MIN_VALUE || vToken == Long.MIN_VALUE) {
                break;
            }
            final int u = (int) uToken;
            final int v = (int) vToken;
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            solver.addEdge(u, v, w);
        }
        solver.solve();
    }

    private void addEdge(int u, int v, long w) {
        edgeFrom[edgeCount] = u;
        edgeTo[edgeCount] = v;
        edgeWeight[edgeCount] = w;
        edgeCount++;
    }

    private void solve() {
        /*
         * Every vertex starts at zero, as if a virtual source were joined to it
         * by an edge of weight zero. n relaxation passes then either produce
         * the potentials or expose a negative cycle.
         */
        final long[] height = new long[n];
        boolean negativeCycle = false;
        for (int pass = 0; pass < n; pass++) {
            boolean changed = false;
            for (int e = 0; e < edgeCount; e++) {
                final long candidate = height[edgeFrom[e]] + edgeWeight[e];
                if (candidate < height[edgeTo[e]]) {
                    height[edgeTo[e]] = candidate;
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
            if (pass == n - 1) {
                negativeCycle = true;
            }
        }
        if (negativeCycle) {
            System.out.print("NEGATIVE CYCLE\n");
            return;
        }

        for (int v = 0; v < n; v++) {
            head[v] = -1;
        }
        for (int e = 0; e < edgeCount; e++) {
            final int u = edgeFrom[e];
            final int v = edgeTo[e];
            /* The reduced weight is nonnegative: height[v] <= height[u] + w. */
            arcTo[e] = v;
            arcWeight[e] = edgeWeight[e] + height[u] - height[v];
            next[e] = head[u];
            head[u] = e;
        }

        final long[] distance = new long[n];
        final StringBuilder out = new StringBuilder();
        for (int source = 0; source < n; source++) {
            java.util.Arrays.fill(distance, INFINITY);
            distance[source] = 0;
            heapSize = 0;
            heapPush(0, source);
            while (heapSize > 0) {
                final long current = heapKey[0];
                final int v = heapPop();
                if (current != distance[v]) {
                    continue;
                }
                for (int at = head[v]; at != -1; at = next[at]) {
                    final long candidate = current + arcWeight[at];
                    if (candidate < distance[arcTo[at]]) {
                        distance[arcTo[at]] = candidate;
                        heapPush(candidate, arcTo[at]);
                    }
                }
            }
            for (int v = 0; v < n; v++) {
                if (v > 0) {
                    out.append(' ');
                }
                if (distance[v] == INFINITY) {
                    out.append(-1);
                } else {
                    out.append(distance[v] - height[source] + height[v]);
                }
            }
            out.append('\n');
        }
        System.out.print(out);
    }

    private void heapPush(long key, int vertex) {
        int index = heapSize++;
        while (index > 0) {
            final int parent = (index - 1) / 2;
            if (heapKey[parent] <= key) {
                break;
            }
            heapKey[index] = heapKey[parent];
            heapVertex[index] = heapVertex[parent];
            index = parent;
        }
        heapKey[index] = key;
        heapVertex[index] = vertex;
    }

    /** Remove the smallest entry and return its vertex. */
    private int heapPop() {
        final int top = heapVertex[0];
        final long lastKey = heapKey[--heapSize];
        final int lastVertex = heapVertex[heapSize];
        int index = 0;
        while (true) {
            final int left = 2 * index + 1;
            if (left >= heapSize) {
                break;
            }
            final int right = left + 1;
            final int child = right < heapSize && heapKey[right] < heapKey[left] ? right : left;
            if (heapKey[child] >= lastKey) {
                break;
            }
            heapKey[index] = heapKey[child];
            heapVertex[index] = heapVertex[child];
            index = child;
        }
        if (heapSize > 0) {
            heapKey[index] = lastKey;
            heapVertex[index] = lastVertex;
        }
        return top;
    }

    /**
     * Token scanner over standard input: the matrix output is quadratic, so the
     * input side must not be the bottleneck.
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
