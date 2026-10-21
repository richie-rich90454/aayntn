/**
 * Prefix sums over an array of values.
 *
 * <p>Contract: the returned array holds n+1 entries with prefix[0] = 0 and
 * prefix[i] = prefix[i-1] + a[i-1] for every 1 <= i <= n, so the sum of
 * a[l-1 .. r-1] is prefix[r] - prefix[l-1].
 */
public final class Program {

    private Program() {
    }

    /**
     * Builds the running totals of a.
     *
     * @param a the values
     * @return an array of a.length + 1 sums: result[0] = 0 and
     *     result[i] = result[i-1] + a[i-1]
     */
    public static long[] prefixSums(final long[] a) {
        final long[] prefix = new long[a.length + 1];
        prefix[0] = 0L;
        for (int i = 0; i < a.length; i++) {
            prefix[i + 1] = prefix[i] + a[i];
        }
        return prefix;
    }

    /**
     * Self-check only: the routine above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(final String[] args) {
        final long[] sample = {1, 2, 3, 4, 5};
        final long[] prefix = prefixSums(sample);

        if (prefix[0] != 0L || prefix[1] != 1L || prefix[5] != 15L) {
            throw new AssertionError("unexpected prefix sums");
        }
        // A range sum is the difference of two prefix entries.
        if (prefix[3] - prefix[1] != 5L) {
            throw new AssertionError("unexpected range sum");
        }
    }
}
