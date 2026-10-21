"""Recursive binary search.

Contract: ``a`` is sorted in non-decreasing order, the interval
``[lo, hi]`` is inclusive on both ends, and the result is the 0-based index
of an element equal to ``target``, or -1 when the target is absent.

Every call halves the interval, so the call stack holds one frame per
halving: the depth grows with the array size.
"""


def binary_search_recursive(a, lo, hi, target):
    """Locate ``target`` in ``a[lo .. hi]``."""
    if lo > hi:
        return -1

    # lo + (hi - lo) // 2 cannot overflow the way (lo + hi) // 2 can.
    mid = lo + (hi - lo) // 2
    value = a[mid]
    if value == target:
        return mid
    if value < target:
        return binary_search_recursive(a, mid + 1, hi, target)
    return binary_search_recursive(a, lo, mid - 1, target)


def _self_check():
    """Assert the documented contract; the routine itself performs no I/O."""
    sample = [1, 3, 5, 7]
    assert binary_search_recursive(sample, 0, 3, 5) == 2
    assert binary_search_recursive(sample, 0, 3, 6) == -1
    assert binary_search_recursive(sample, 0, -1, 5) == -1


if __name__ == "__main__":
    _self_check()
