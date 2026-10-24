import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    private static final long INF = 4000000000000000000L;

    private static final class Edge {
        final int to;
        final int rev;
        long cap;
        final long cost;

        Edge(int to, int rev, long cap, long cost) {
            this.to = to;
            this.rev = rev;
            this.cap = cap;
            this.cost = cost;
        }
    }

    private static final class State implements Comparable<State> {
        final long key;
        final int vertex;

        State(long key, int vertex) {
            this.key = key;
            this.vertex = vertex;
        }

        @Override
        public int compareTo(State other) {
            return Long.compare(key, other.key);
        }
    }

    private static final class FastScanner {
        private final InputStream stream;
        private final byte[] buffer = new byte[1 << 16];
        private int length;
        private int index;

        FastScanner(InputStream stream) {
            this.stream = stream;
        }

        private int read() {
            if (index >= length) {
                try {
                    length = stream.read(buffer);
                } catch (IOException exception) {
                    length = -1;
                }
                index = 0;
                if (length <= 0) {
                    return -1;
                }
            }
            return buffer[index++];
        }

        long nextLong() {
            int current = read();
            while (current <= ' ') {
                if (current == -1) {
                    return 0;
                }
                current = read();
            }
            int sign = 1;
            if (current == '-') {
                sign = -1;
                current = read();
            }
            long value = 0;
            while (current > ' ') {
                value = value * 10 + (current - '0');
                current = read();
            }
            return sign * value;
        }

        int nextInt() {
            return (int) nextLong();
        }
    }

    public static void main(String[] args) {
        FastScanner scanner = new FastScanner(System.in);
        int n = scanner.nextInt();
        int m = scanner.nextInt();
        int s = scanner.nextInt();
        int t = scanner.nextInt();
        if (n <= 0 || s < 0 || s >= n || t < 0 || t >= n || s == t) {
            System.out.print("0 0\n");
            return;
        }
        if (m < 0) {
            m = 0;
        }

        List<List<Edge>> graph = new ArrayList<>();
        for (int v = 0; v < n; v++) {
            graph.add(new ArrayList<>());
        }
        for (int e = 0; e < m; e++) {
            int u = scanner.nextInt();
            int v = scanner.nextInt();
            long cap = scanner.nextLong();
            long cost = scanner.nextLong();
            if (u < 0 || u >= n || v < 0 || v >= n || cap < 0) {
                continue;
            }
            graph.get(u).add(new Edge(v, graph.get(v).size(), cap, cost));
            graph.get(v).add(new Edge(u, graph.get(u).size() - 1, 0, -cost));
        }

        long[] height = new long[n];
        long[] distance = new long[n];
        int[] previousVertex = new int[n];
        int[] previousEdge = new int[n];
        long flow = 0;
        long total = 0;

        while (true) {
            for (int v = 0; v < n; v++) {
                distance[v] = INF;
                previousVertex[v] = -1;
                previousEdge[v] = -1;
            }
            distance[s] = 0;
            PriorityQueue<State> queue = new PriorityQueue<>();
            queue.add(new State(0, s));
            while (!queue.isEmpty()) {
                State current = queue.poll();
                if (current.key != distance[current.vertex]) {
                    continue;
                }
                List<Edge> outgoing = graph.get(current.vertex);
                for (int i = 0; i < outgoing.size(); i++) {
                    Edge edge = outgoing.get(i);
                    if (edge.cap <= 0) {
                        continue;
                    }
                    // The reduced cost is nonnegative while the potentials are feasible.
                    long candidate =
                            current.key + edge.cost + height[current.vertex] - height[edge.to];
                    if (candidate < distance[edge.to]) {
                        distance[edge.to] = candidate;
                        previousVertex[edge.to] = current.vertex;
                        previousEdge[edge.to] = i;
                        queue.add(new State(candidate, edge.to));
                    }
                }
            }
            if (distance[t] == INF) {
                break;
            }
            for (int v = 0; v < n; v++) {
                if (distance[v] < INF) {
                    height[v] += distance[v];
                }
            }

            long add = INF;
            for (int v = t; v != s; v = previousVertex[v]) {
                add = Math.min(add, graph.get(previousVertex[v]).get(previousEdge[v]).cap);
            }
            for (int v = t; v != s; v = previousVertex[v]) {
                Edge edge = graph.get(previousVertex[v]).get(previousEdge[v]);
                edge.cap -= add;
                graph.get(edge.to).get(edge.rev).cap += add;
            }
            flow += add;
            total += add * (height[t] - height[s]);
        }

        StringBuilder output = new StringBuilder();
        output.append(flow).append(' ').append(total).append('\n');
        System.out.print(output);
    }
}
