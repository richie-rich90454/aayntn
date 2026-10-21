import java.util.Arrays;

/**
 * A monotone convex hull trick over the lines y = m * x + b: the lines are
 * added with a non-decreasing slope, the queries arrive with a non-decreasing
 * x, and the answer is the smallest value of the lines added so far.
 *
 * The hull is a stack of lines with increasing slopes. The line on top of the
 * stack is the one that is smallest for the smallest x, and a query walks
 * down the stack as the x grows.
 *
 * The arrays belong to the Java heap, so the garbage collector reclaims them
 * and no explicit destroy call is needed.
 */
public final class Program {

    private Program() {
    }

    public static final class ConvexHull {
        private long[] slope;
        private long[] intercept;
        private int size;

        public ConvexHull() {
            this(8);
        }

        public ConvexHull(int capacity) {
            this.slope = new long[Math.max(capacity, 1)];
            this.intercept = new long[Math.max(capacity, 1)];
            this.size = 0;
        }

        /**
         * Adds the line y = m * x + b. The slope must not be smaller than the
         * slope of the line added before, which is what makes the amortised
         * cost of the operations constant.
         *
         * @param m the slope of the line
         * @param b the intercept of the line
         */
        public void add(long m, long b) {
            while (size > 0 && slope[size - 1] == m) {
                if (intercept[size - 1] <= b) {
                    // The new line is never the smallest, so it is dropped.
                    return;
                }
                // The new line wins against the line with the same slope.
                size--;
            }
            while (size >= 2 &&
                   redundant(slope[size - 2], intercept[size - 2],
                             slope[size - 1], intercept[size - 1], m, b)) {
                // The line on top of the stack is never the smallest.
                size--;
            }
            if (size == slope.length) {
                slope = Arrays.copyOf(slope, size * 2);
                intercept = Arrays.copyOf(intercept, size * 2);
            }
            slope[size] = m;
            intercept[size] = b;
            size++;
        }

        /**
         * The smallest value of the lines added so far at the point x. The x
         * values must not decrease, which is what lets the query drop the lines
         * it walks past. The answer of a query with no line at all is 0.
         *
         * @param x the point of the query
         * @return the smallest value
         */
        public long query(long x) {
            if (size == 0) {
                return 0L;
            }
            while (size >= 2) {
                final long top = slope[size - 1] * x + intercept[size - 1];
                final long below = slope[size - 2] * x + intercept[size - 2];
                if (below >= top) {
                    break;
                }
                /*
                 * The line on top of the stack has the larger slope, so it
                 * stays the worse of the two for every larger x and is dropped
                 * for good.
                 */
                size--;
            }
            return slope[size - 1] * x + intercept[size - 1];
        }

        /**
         * True when the middle line of the three never holds the minimum: the
         * switch points of the neighbours have to decrease along the stack,
         * and the comparison is done on the switch points, so the products of
         * the coefficients never enter the arithmetic.
         */
        private static boolean redundant(long m1, long b1, long m2, long b2,
                                         long m3, long b3) {
            return (double) (b1 - b2) / (double) (m2 - m1) <=
                   (double) (b2 - b3) / (double) (m3 - m2);
        }
    }

    /*
     * Self-check only: the class above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final ConvexHull hull = new ConvexHull();

        hull.add(1, 0);
        hull.add(2, -1);
        // The line 2x - 1 is never the smallest, so it is pruned.
        hull.add(3, -3);

        if (hull.query(0) != -3L) {
            throw new IllegalStateException("hull contract broken");
        }
        if (hull.query(1) != 0L) {
            throw new IllegalStateException("hull contract broken");
        }
        if (hull.query(2) != 2L) {
            throw new IllegalStateException("hull contract broken");
        }

        // A new line with a larger slope can win for the current x.
        hull.add(4, -20);
        if (hull.query(3) != -8L) {
            throw new IllegalStateException("hull contract broken");
        }

        // A line with the same slope wins only with a smaller intercept.
        hull.add(4, -30);
        if (hull.query(3) != -18L) {
            throw new IllegalStateException("hull contract broken");
        }
        hull.add(4, 0);
        if (hull.query(3) != -18L) {
            throw new IllegalStateException("hull contract broken");
        }
    }
}
