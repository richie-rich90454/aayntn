import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

/**
 * Nearest-neighbor queries on a static two-dimensional point set.
 *
 * <p>Input: n, then n points, then q, then q query points. Output: for each
 * query, the 1-based index of the nearest input point by squared Euclidean
 * distance, with ties broken by the lowest index.
 *
 * <p>The tree splits alternately on x and y at the median, so every subtree is
 * a rectangle and the recursion has depth O(log n).
 */
public final class Main {

    private Main() {
    }

    private static long[] xs;
    private static long[] ys;
    private static Integer[] order;
    private static int[] leftChild;
    private static int[] rightChild;
    private static long bestDist;
    private static int bestIndex;

    private static long squaredDistance(int index, long qx, long qy) {
        final long dx = xs[index] - qx;
        final long dy = ys[index] - qy;
        return dx * dx + dy * dy;
    }

    private static int build(int lo, int hi, int depth) {
        if (lo >= hi) {
            return -1;
        }
        final int axis = depth & 1;
        Arrays.sort(order, lo, hi, (a, b) -> {
            final long va = axis == 0 ? xs[a] : ys[a];
            final long vb = axis == 0 ? xs[b] : ys[b];
            if (va != vb) {
                return Long.compare(va, vb);
            }
            return Integer.compare(a, b);
        });
        final int mid = lo + (hi - lo) / 2;
        final int node = order[mid];
        leftChild[node] = build(lo, mid, depth + 1);
        rightChild[node] = build(mid + 1, hi, depth + 1);
        return node;
    }

    private static void nearest(int node, long qx, long qy, int depth) {
        if (node < 0) {
            return;
        }
        final long d = squaredDistance(node, qx, qy);
        if (d < bestDist || (d == bestDist && node < bestIndex)) {
            bestDist = d;
            bestIndex = node;
        }

        final int axis = depth & 1;
        final long delta = axis == 0 ? qx - xs[node] : qy - ys[node];
        final int nearChild = delta <= 0 ? leftChild[node] : rightChild[node];
        final int farChild = delta <= 0 ? rightChild[node] : leftChild[node];

        nearest(nearChild, qx, qy, depth + 1);
        // Equality is not pruned: a point at the same distance can have a lower index.
        if (delta * delta <= bestDist) {
            nearest(farChild, qx, qy, depth + 1);
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        if (n <= 0) {
            return;
        }

        xs = new long[n];
        ys = new long[n];
        order = new Integer[n];
        leftChild = new int[n];
        rightChild = new int[n];
        for (int i = 0; i < n; i++) {
            xs[i] = fs.nextLong();
            ys[i] = fs.nextLong();
            order[i] = i;
        }

        final int root = build(0, n, 0);

        final int q = (int) fs.nextLong();
        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < q; i++) {
            final long qx = fs.nextLong();
            final long qy = fs.nextLong();
            bestDist = Long.MAX_VALUE;
            bestIndex = -1;
            nearest(root, qx, qy, 0);
            out.append(bestIndex + 1).append('\n');
        }
        System.out.print(out);
    }

    /** Token scanner over standard input. */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer == available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
