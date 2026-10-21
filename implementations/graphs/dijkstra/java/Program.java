import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Dijkstra's algorithm over a graph whose edge weights are all nonnegative.
 *
 * <p>The priority queue holds (distance, vertex) pairs and an entry is never
 * removed from the middle of the queue: a shorter path to a vertex pushes a
 * second entry and the stale one is discarded when it surfaces. That replaces a
 * decrease-key operation by at most one extra entry per successful relaxation,
 * so the queue holds O(E) entries.
 */
public final class Program {

    private Program() {
    }

    /** An edge of the adjacency list: a neighbour and the weight of the edge. */
    public static final class Edge {
        public final int to;
        public final long weight;

        public Edge(int to, long weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    /** A queue entry ordered by distance, so the queue is a binary min-heap. */
    private static final class QueueEntry implements Comparable<QueueEntry> {
        final long distance;
        final int vertex;

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
     * @param adj    adjacency list; adj.get(v) holds the edges incident to v
     * @param source the start vertex
     * @return the distance from source to every vertex, -1 when unreachable
     */
    public static long[] dijkstra(List<List<Edge>> adj, int source) {
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

    /*
     * Self-check only: the method above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final List<List<Edge>> graph = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            graph.add(new ArrayList<>());
        }
        graph.get(0).add(new Edge(1, 4L));
        graph.get(0).add(new Edge(2, 2L));
        graph.get(1).add(new Edge(0, 4L));
        graph.get(1).add(new Edge(2, 1L));
        graph.get(2).add(new Edge(0, 2L));
        graph.get(2).add(new Edge(1, 1L));
        graph.get(2).add(new Edge(3, 8L));
        graph.get(3).add(new Edge(2, 8L));

        final long[] distance = dijkstra(graph, 0);
        if (distance.length != 5) {
            throw new IllegalStateException("dijkstra contract broken");
        }
        if (distance[0] != 0L || distance[1] != 3L || distance[2] != 2L ||
                distance[3] != 10L || distance[4] != -1L) {
            throw new IllegalStateException("dijkstra contract broken");
        }

        // The start vertex is the only one reachable from an isolated vertex.
        final long[] isolated = dijkstra(graph, 4);
        if (isolated[0] != -1L || isolated[3] != -1L || isolated[4] != 0L) {
            throw new IllegalStateException("dijkstra contract broken");
        }

        // A start vertex outside the graph leaves every distance unknown.
        final long[] outside = dijkstra(graph, 5);
        if (outside[0] != -1L || outside[4] != -1L) {
            throw new IllegalStateException("dijkstra contract broken");
        }
    }
}
