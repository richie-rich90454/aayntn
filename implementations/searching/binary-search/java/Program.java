/**
 * Binary search over a sorted array.
 *
 * <p>Contract: {@code a} is sorted in non-decreasing order and the search
 * interval is inclusive on both ends, so an empty array is the only base
 * case. Returns the 0-based index of an element equal to {@code target}, or
 * -1 when the target is absent.
 */
public final class Program {

    private Program() {
    }

    /**
     * Locates {@code target} in a sorted array.
     *
     * @param a      values sorted in non-decreasing order
     * @param target value to locate
     * @return the 0-based index of a matching element, or -1
     */
    public static int binarySearch(final long[] a, final long target) {
        int lo = 0;
        int hi = a.length - 1;

        while (lo <= hi) {
            // lo + (hi - lo) / 2 cannot overflow the way (lo + hi) / 2 can.
            final int mid = lo + (hi - lo) / 2;

            if (a[mid] == target) {
                return mid;
            }
            if (a[mid] < target) {
                lo = mid + 1; // every element at or below mid is too small
            } else {
                hi = mid - 1; // every element at or above mid is too large
            }
        }
        return -1;
    }

    /**
     * Self-check only: the routine above is the reusable part, so this file
     * asserts the documented contract instead of reading input.
     */
    public static void main(final String[] args) {
        final long[] sample = {1, 3, 5, 7};

        if (binarySearch(sample, 5) != 2) {
            throw new AssertionError("expected index 2 for target 5");
        }
        if (binarySearch(sample, 6) != -1) {
            throw new AssertionError("expected -1 for a missing target");
        }
        if (binarySearch(new long[0], 5) != -1) {
            throw new AssertionError("expected -1 for an empty array");
        }
    }
}
