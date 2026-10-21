/**
 * 0/1 knapsack: the maximum total value of a subset of the items whose total
 * weight fits in a capacity, where every item may be taken at most once.
 */
public final class Program {

    private Program() {
    }

    /**
     * Maximum total value of a subset of the items whose total weight is at
     * most capacity.
     *
     * @param weights  the weight of every item
     * @param values   the value of every item, parallel to weights
     * @param capacity the weight budget
     * @return the largest total value that fits in capacity
     */
    public static long knapsackMaxValue(int[] weights, long[] values, int capacity) {
        if (capacity < 0) {
            return 0;
        }

        final long[] table = new long[capacity + 1];
        final int count = Math.min(weights.length, values.length);
        for (int i = 0; i < count; i++) {
            final int weight = Math.max(0, weights[i]);

            // The capacity must run downwards: table[c - weight] has to still
            // hold the answer for the items before item i. With an upwards
            // sweep that cell would already include item i, so the item would
            // be counted more than once and the table would solve the
            // unbounded knapsack.
            for (int c = capacity; c >= weight; c--) {
                final long candidate = table[c - weight] + values[i];
                if (candidate > table[c]) {
                    table[c] = candidate;
                }
            }
        }

        return table[capacity];
    }

    /*
     * Self-check only: the routine above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(String[] args) {
        final int[] weights = {3, 4, 5, 2};
        final long[] values = {4, 5, 7, 3};

        if (knapsackMaxValue(weights, values, 7) != 10L) {
            throw new IllegalStateException("knapsack contract broken");
        }

        // An item that fits twice is still worth its value only once.
        if (knapsackMaxValue(new int[] {2}, new long[] {3}, 4) != 3L) {
            throw new IllegalStateException("knapsack contract broken");
        }

        // An item heavier than the budget is never taken.
        if (knapsackMaxValue(new int[] {5}, new long[] {9}, 4) != 0L) {
            throw new IllegalStateException("knapsack contract broken");
        }

        // No items at all.
        if (knapsackMaxValue(new int[] {}, new long[] {}, 7) != 0L) {
            throw new IllegalStateException("knapsack contract broken");
        }
    }
}
