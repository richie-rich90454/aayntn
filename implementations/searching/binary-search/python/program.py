"""Binary search driver.

Reads n, a sorted run of integers and a target from standard input, then
prints the 0-based index of the target, or -1 when it is absent.
"""

import sys


def binary_search(a, target):
    """Locate ``target`` in the sorted sequence ``a``."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        value = a[mid]
        if value == target:
            return mid
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        sys.stdout.write("-1\n")
        return

    values = [int(token) for token in data]
    declared = values[0]
    target = values[-1]
    available = len(values) - 2
    array_length = declared if declared < available else available
    if array_length < 0:
        array_length = 0

    answer = binary_search(values[1:1 + array_length], target)
    sys.stdout.write("{}\n".format(answer))


if __name__ == "__main__":
    main()
