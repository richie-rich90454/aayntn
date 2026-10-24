import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/**
 * The number of distinct colors in the subtree of every vertex, read from
 * standard input.
 *
 * <p>Input: n, then n colors (0-based vertices), then the parents of vertices 1
 * through n-1. Every parent is smaller than its child, so vertex 0 is the root
 * and the vertices are listed in a topological order.
 * <p>Output: n lines; line v holds the number of distinct colors in the subtree
 * of v.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final Input input = new Input();
        final int n = input.next();
        if (n <= 0) {
            return;
        }

        final int[] color = new int[n];
        for (int v = 0; v < n; v++) {
            color[v] = input.next();
        }

        final int[] parent = new int[n];
        parent[0] = -1;
        for (int v = 1; v < n; v++) {
            final int p = input.next();
            /* The contract numbers parents before children; a bad index falls back to the root. */
            parent[v] = p >= 0 && p < v ? p : 0;
        }

        final List<HashSet<Integer>> sets = new ArrayList<>(n);
        for (int v = 0; v < n; v++) {
            final HashSet<Integer> set = new HashSet<>();
            set.add(color[v]);
            sets.add(set);
        }
        final int[] answer = new int[n];
        final int[] weight = new int[n];
        for (int v = 0; v < n; v++) {
            weight[v] = 1;
        }

        /*
         * Every child has a larger index than its parent, so this reverse sweep
         * is a postorder: when v is reached, all of its children are already in
         * its set.
         */
        for (int v = n - 1; v >= 1; v--) {
            answer[v] = sets.get(v).size();
            final int p = parent[v];
            /*
             * Keep the larger live component as the base and pour the smaller one
             * into it. The weight counts the vertices the component represents, so
             * the component that holds a moved element at least doubles.
             */
            HashSet<Integer> base = sets.get(p);
            HashSet<Integer> smaller = sets.get(v);
            if (weight[p] < weight[v]) {
                final HashSet<Integer> swap = base;
                base = smaller;
                smaller = swap;
                final int weightSwap = weight[p];
                weight[p] = weight[v];
                weight[v] = weightSwap;
            }
            for (final int c : smaller) {
                base.add(c);
            }
            weight[p] += weight[v];
            sets.set(p, base);
            sets.set(v, smaller);
            smaller.clear();
        }
        answer[0] = sets.get(0).size();

        final StringBuilder out = new StringBuilder();
        for (int v = 0; v < n; v++) {
            out.append(answer[v]).append('\n');
        }
        // An explicit newline keeps the output identical on every platform.
        System.out.print(out.toString());
    }

    /** Token scanner over standard input: contest inputs are too large for java.util.Scanner. */
    private static final class Input {
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

        /** The next nonnegative integer, or 0 when the input has ended. */
        int next() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return 0;
            }
            int value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value;
        }
    }
}
