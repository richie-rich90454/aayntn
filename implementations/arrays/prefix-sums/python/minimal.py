"""Prefix sums over a sequence of values.

Contract: the returned list holds n+1 entries with prefix[0] = 0 and
prefix[i] = prefix[i-1] + a[i-1] for every 1 <= i <= n, so the sum of
a[l-1 .. r-1] is prefix[r] - prefix[l-1].

The caller keeps ownership of the sequence; the function does not copy it.
"""


def prefix_sums(a):
    """Return the running totals of the sequence ``a``."""
    prefix = [0] * (len(a) + 1)
    for i, value in enumerate(a):
        prefix[i + 1] = prefix[i] + value
    return prefix


def _self_check():
    """Assert the documented contract; the routine itself performs no I/O."""
    prefix = prefix_sums([1, 2, 3, 4, 5])
    assert prefix[0] == 0
    assert prefix[1] == 1
    assert prefix[5] == 15
    # A range sum is the difference of two prefix entries.
    assert prefix[3] - prefix[1] == 5


if __name__ == "__main__":
    _self_check()
