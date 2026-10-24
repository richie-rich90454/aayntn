"""Sorted range search driver.

Reads n, then n disjoint intervals sorted by left endpoint, then one point.
Prints the 0-based index of the interval that contains the point, or -1 when
no interval contains it.
"""

import sys


def locate(intervals, point):
    """Return the index of the interval containing ``point``, or -1."""
    lo, hi = 0, len(intervals) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        left, right = intervals[mid]
        if point < left:
            hi = mid - 1
        elif point > right:
            lo = mid + 1
        else:
            return mid
    return -1


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        sys.stdout.write("-1\n")
        return

    n = int(data[0])
    if n < 0 or len(data) < 2 * n + 2:
        sys.stdout.write("-1\n")
        return

    values = [int(token) for token in data[1 : 2 * n + 1]]
    intervals = list(zip(values[0::2], values[1::2]))
    point = int(data[2 * n + 1])
    sys.stdout.write("{}\n".format(locate(intervals, point)))


if __name__ == "__main__":
    main()
