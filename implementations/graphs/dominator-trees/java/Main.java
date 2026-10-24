import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * The dominator tree of a directed graph, read from standard input.
 *
 * <p>The algorithm is the iterative dataflow version of Cooper, Harvey and
 * Kennedy, not Lengauer-Tarjan. Vertices are visited in reverse postorder of a
 * depth-first search from the source, and the immediate dominator of a vertex
 * is the deepest common ancestor of its predecessors in the partially built
 * dominator tree. The passes repeat until no immediate dominator changes.
 *
 * <p>Input: n m s, then m lines u v (0-based, directed).
 * Output: the immediate dominator of every vertex in index order. The source
 * prints 0, and a vertex the source cannot reach prints -1.
 */
public final class Main {

    private Main() {
    }

    /**
     * The deepest common ancestor of a and b in the partially built dominator
     * tree.
     *
     * <p>order[v] is the position of v in the reverse postorder, so an
     * ancestor always has a smaller number than its descendants. The walk
     * climbs the vertex with the larger number until the two meet.
     */
    private static int intersect(int a, int b, int[] idom, int[] order) {
        while (a != b) {
            while (order[a] > order[b]) {
                a = idom[a];
            }
            while (order[b] > order[a]) {
                b = idom[b];
            }
        }
        return a;
    }

    /**
     * Computes the immediate dominator of every vertex.
     *
     * <p>The graph is stored as a head array and linked edge arrays for the
     * successors and for the predecessors.
     */
    private static int[] immediateDominators(int n, int[] adjHead, int[] adjTo, int[] adjNext,
            int[] predHead, int[] predTo, int[] predNext, int source) {
        final int[] idom = new int[n];
        final int[] order = new int[n];
        Arrays.fill(idom, -1);
        Arrays.fill(order, -1);
        if (source < 0 || source >= n) {
            return idom;
        }

        /*
         * Iterative depth-first search. A vertex enters the postorder when its
         * last successor has been examined, and the reverse of that order is
         * the order the dominator computation needs.
         */
        final boolean[] visited = new boolean[n];
        final int[] nextEdge = new int[n];
        final int[] postorder = new int[n];
        final int[] stack = new int[n];
        System.arraycopy(adjHead, 0, nextEdge, 0, n);
        int postorderLength = 0;
        int top = 0;
        visited[source] = true;
        stack[top++] = source;
        while (top > 0) {
            final int v = stack[top - 1];
            int e = nextEdge[v];
            while (e != -1 && visited[adjTo[e]]) {
                e = adjNext[e];
            }
            nextEdge[v] = e;
            if (e == -1) {
                postorder[postorderLength++] = v;
                top--;
            } else {
                nextEdge[v] = adjNext[e];
                final int w = adjTo[e];
                visited[w] = true;
                stack[top++] = w;
            }
        }

        final int[] rpo = new int[postorderLength];
        for (int i = 0; i < postorderLength; i++) {
            rpo[i] = postorder[postorderLength - 1 - i];
            order[rpo[i]] = i;
        }

        idom[source] = source;
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int i = 1; i < postorderLength; i++) {
                final int v = rpo[i];
                int candidate = -1;
                for (int e = predHead[v]; e != -1; e = predNext[e]) {
                    final int p = predTo[e];
                    if (idom[p] == -1) {
                        // The predecessor is not reachable from the source.
                        continue;
                    }
                    candidate = candidate == -1 ? p : intersect(p, candidate, idom, order);
                }
                if (candidate != -1 && idom[v] != candidate) {
                    idom[v] = candidate;
                    changed = true;
                }
            }
        }
        return idom;
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        final long sourceToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        final int m = (int) Math.max(0L, mToken);
        final int source = sourceToken == Long.MIN_VALUE ? -1 : (int) sourceToken;
        if (n <= 0) {
            System.out.print("\n");
            return;
        }

        final int[] adjHead = new int[n];
        final int[] predHead = new int[n];
        final int[] adjTo = new int[m];
        final int[] adjNext = new int[m];
        final int[] predTo = new int[m];
        final int[] predNext = new int[m];
        Arrays.fill(adjHead, -1);
        Arrays.fill(predHead, -1);

        int kept = 0;
        for (int i = 0; i < m; i++) {
            final long uToken = fs.nextLong();
            if (uToken == Long.MIN_VALUE) {
                break;
            }
            final long vToken = fs.nextLong();
            if (vToken == Long.MIN_VALUE) {
                break;
            }
            final int u = (int) uToken;
            final int v = (int) vToken;
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            adjTo[kept] = v;
            adjNext[kept] = adjHead[u];
            adjHead[u] = kept;
            predTo[kept] = u;
            predNext[kept] = predHead[v];
            predHead[v] = kept;
            kept++;
        }

        final int[] idom = immediateDominators(n, adjHead, adjTo, adjNext, predHead, predTo, predNext,
                source);

        final StringBuilder line = new StringBuilder();
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                line.append(' ');
            }
            if (v == source) {
                line.append(0);
            } else {
                line.append(idom[v]);
            }
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
