"""Binary search over a sorted sequence.

Contract: ``a`` is sorted in non-decreasing order and the search interval is
inclusive on both ends, so an empty sequence is the only base case. Returns
the 0-based index of an element equal to ``target``, or -1 when the target is
absent.

The caller keeps ownership of the sequence; the function does not copy it.
"""


def binary_search(a, target):
    """Locate ``target`` in the sorted sequence ``a``."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        # lo + (hi - lo) // 2 cannot overflow the way (lo + hi) // 2 can.
        mid = lo + (hi - lo) // 2
        value = a[mid]
        if value == target:
            return mid
        if value < target:
            lo = mid + 1  # every element at or below mid is too small
        else:
            hi = mid - 1  # every element at or above mid is too large
    return -1


def _self_check():
    """Assert the documented contract; the routine itself performs no I/O."""
    sample = [1, 3, 5, 7]
    assert binary_search(sample, 5) == 2
    assert binary_search(sample, 6) == -1
    assert binary_search([], 5) == -1


if __name__ == "__main__":
    _self_check()
