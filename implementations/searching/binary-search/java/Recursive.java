/**
 * Recursive binary search.
 *
 * <p>Contract: {@code a} is sorted in non-decreasing order, the interval
 * {@code [lo, hi]} is inclusive on both ends, and the result is the 0-based
 * index of an element equal to {@code target}, or -1 when the target is
 * absent.
 *
 * <p>Every call halves the interval, so the call stack holds one frame per
 * halving: the depth grows with the array size.
 */
public final class Recursive {

    private Recursive() {
    }

    /**
     * Locates {@code target} in {@code a[lo .. hi]}.
     *
     * @param a      values sorted in non-decreasing order
     * @param lo     first index of the inclusive search interval
     * @param hi     last index of the inclusive search interval
     * @param target value to locate
     * @return the 0-based index of a matching element, or -1
     */
    public static int binarySearch(final long[] a, final int lo, final int hi, final long target) {
        if (lo > hi) {
            return -1;
        }

        // lo + (hi - lo) / 2 cannot overflow the way (lo + hi) / 2 can.
        final int mid = lo + (hi - lo) / 2;

        if (a[mid] == target) {
            return mid;
        }
        if (a[mid] < target) {
            return binarySearch(a, mid + 1, hi, target);
        }
        return binarySearch(a, lo, mid - 1, target);
    }

    /**
     * Self-check only: the routine above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(final String[] args) {
        final long[] sample = {1, 3, 5, 7};

        if (binarySearch(sample, 0, 3, 5) != 2) {
            throw new AssertionError("expected index 2 for target 5");
        }
        if (binarySearch(sample, 0, 3, 6) != -1) {
            throw new AssertionError("expected -1 for a missing target");
        }
        if (binarySearch(sample, 0, -1, 5) != -1) {
            throw new AssertionError("expected -1 for an empty interval");
        }
    }
}
