import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Dijkstra's algorithm over an undirected weighted graph read from standard
 * input.
 *
 * <p>Input: n m, then m lines u v w (0-based, undirected, nonnegative weight),
 * then the start vertex.
 * Output: the distance from the start vertex to every vertex, separated by
 * spaces, and -1 for the vertices the start cannot reach.
 */
public final class Main {

    private Main() {
    }

    /** An edge of the adjacency list: a neighbour and the weight of the edge. */
    private static final class Edge {
        private final int to;
        private final long weight;

        Edge(int to, long weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    /** A queue entry ordered by distance, so the queue is a binary min-heap. */
    private static final class QueueEntry implements Comparable<QueueEntry> {
        private final long distance;
        private final int vertex;

        QueueEntry(long distance, int vertex) {
            this.distance = distance;
            this.vertex = vertex;
        }

        @Override
        public int compareTo(QueueEntry other) {
            return Long.compare(distance, other.distance);
        }
    }

    /**
     * Computes the distance from source to every vertex of a graph whose edge
     * weights are all nonnegative.
     *
     * <p>The priority queue holds (distance, vertex) pairs and an entry is
     * never removed from the middle of the queue: a shorter path to a vertex
     * pushes a second entry and the stale one is discarded when it surfaces.
     * That replaces a decrease-key operation by at most one extra entry per
     * successful relaxation, so the queue holds O(E) entries.
     *
     * @param adj    adjacency list; adj.get(v) holds the edges incident to v
     * @param source the start vertex
     * @return the distance from source to every vertex, -1 when unreachable
     */
    private static long[] dijkstra(List<List<Edge>> adj, int source) {
        final long[] distance = new long[adj.size()];
        Arrays.fill(distance, -1L);
        if (source < 0 || source >= distance.length) {
            return distance;
        }

        final PriorityQueue<QueueEntry> heap = new PriorityQueue<>();
        distance[source] = 0;
        heap.add(new QueueEntry(0L, source));
        while (!heap.isEmpty()) {
            final QueueEntry top = heap.poll();
            final int v = top.vertex;
            if (top.distance != distance[v]) {
                // A shorter path was found after this entry was pushed.
                continue;
            }
            for (final Edge edge : adj.get(v)) {
                final long candidate = top.distance + edge.weight;
                if (distance[edge.to] >= 0 && candidate >= distance[edge.to]) {
                    // The relaxation would not improve the distance.
                    continue;
                }
                distance[edge.to] = candidate;
                heap.add(new QueueEntry(candidate, edge.to));
            }
        }
        return distance;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        final int m = (int) mToken;
        if (n <= 0) {
            System.out.print("\n");
            return;
        }

        final List<List<Edge>> adj = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }
        for (int i = 0; i < m; i++) {
            final int u = (int) fs.nextLong();
            final int v = (int) fs.nextLong();
            final long w = fs.nextLong();
            if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
                continue;
            }
            adj.get(u).add(new Edge(v, w));
            adj.get(v).add(new Edge(u, w));
        }
        final long sourceToken = fs.nextLong();
        final int source = sourceToken == Long.MIN_VALUE ? -1 : (int) sourceToken;

        final long[] distance = dijkstra(adj, source);

        final StringBuilder line = new StringBuilder();
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                line.append(' ');
            }
            line.append(distance[v]);
        }
        // An explicit newline keeps the output identical on every platform.
        System.out.print(line.toString() + "\n");
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
