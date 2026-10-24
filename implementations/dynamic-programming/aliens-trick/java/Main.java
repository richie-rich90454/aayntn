import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;

/**
 * The aliens trick for splitting an array into exactly k contiguous groups.
 *
 * <p>Input: n k, then n nonnegative integers. Output: the minimum possible sum
 * of squared group sums. A group spanning prefix positions j + 1 .. i costs
 * (prefix[i] - prefix[j])^2. Charging a penalty for every group removes the
 * group count from the state, and a binary search over the penalty recovers the
 * answer for exactly k groups.
 */
public final class Main {

    private static final class Line {
        long slope;
        long intercept;
        int groups;
        boolean present;

        Line(long slope, long intercept, int groups) {
            this.slope = slope;
            this.intercept = intercept;
            this.groups = groups;
            this.present = true;
        }

        Line() {
            this.present = false;
        }
    }

    private static long[] prefix;
    private static Line[] tree;
    private static int n;

    private Main() {
    }

    private static boolean better(Line left, Line right, long x) {
        final long leftValue = left.slope * x + left.intercept;
        final long rightValue = right.slope * x + right.intercept;
        if (leftValue != rightValue) {
            return leftValue < rightValue;
        }
        return left.groups > right.groups;
    }

    private static void insert(int node, int left, int right, Line line) {
        if (tree[node] == null) {
            tree[node] = line;
            return;
        }
        final int mid = left + (right - left) / 2;
        if (better(line, tree[node], prefix[mid])) {
            final Line previous = tree[node];
            tree[node] = line;
            line = previous;
        }
        if (left == right) {
            return;
        }
        if (better(line, tree[node], prefix[left])) {
            insert(2 * node, left, mid, line);
        } else if (better(line, tree[node], prefix[right])) {
            insert(2 * node + 1, mid + 1, right, line);
        }
    }

    private static Line query(int index) {
        int node = 1;
        int left = 0;
        int right = n;
        final long x = prefix[index];
        Line best = null;
        while (true) {
            if (tree[node] != null && (best == null || better(tree[node], best, x))) {
                best = tree[node];
            }
            if (left == right) {
                break;
            }
            final int mid = left + (right - left) / 2;
            if (index <= mid) {
                node *= 2;
                right = mid;
            } else {
                node = 2 * node + 1;
                left = mid + 1;
            }
        }
        return best;
    }

    /**
     * Returns the best penalized value; the number of groups is written to
     * outGroups[0].
     */
    private static long penalized(long penalty, int[] outGroups) {
        tree = new Line[4 * (n + 1) + 8];
        insert(1, 0, n, new Line(0, 0, 0));

        long value = 0;
        int groups = 0;
        for (int i = 1; i <= n; i++) {
            final long x = prefix[i];
            final Line line = query(i);
            value = line.slope * x + line.intercept + x * x + penalty;
            groups = line.groups + 1;
            insert(1, 0, n, new Line(-2 * x, value + x * x, groups));
        }
        outGroups[0] = groups;
        return value;
    }

    public static void main(String[] args) throws IOException {
        final StreamTokenizer in =
                new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
        if (in.nextToken() == StreamTokenizer.TT_EOF) {
            return;
        }
        n = (int) in.nval;
        if (in.nextToken() == StreamTokenizer.TT_EOF) {
            return;
        }
        int k = (int) in.nval;
        if (n <= 0) {
            System.out.println("0");
            return;
        }
        if (k < 1) {
            k = 1;
        }
        if (k > n) {
            k = n;
        }

        prefix = new long[n + 1];
        for (int i = 1; i <= n; i++) {
            if (in.nextToken() == StreamTokenizer.TT_EOF) {
                break;
            }
            prefix[i] = prefix[i - 1] + (long) in.nval;
        }

        final long total = prefix[n];
        long low = 0;
        long high = total * total + 1;
        final int[] groups = new int[1];
        while (low < high) {
            final long mid = low + (high - low + 1) / 2;
            penalized(mid, groups);
            if (groups[0] >= k) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        final long value = penalized(low, groups);
        System.out.println(value - low * (long) k);
    }
}
