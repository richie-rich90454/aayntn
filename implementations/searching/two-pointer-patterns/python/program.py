"""Two-pointer pair count driver.

Reads n, then n integers in non-decreasing order, then the target.
Prints the number of index pairs i < j whose sum is at most the target.
"""

import sys


def count_pairs(values, target):
    """Return the number of index pairs whose sum is at most ``target``."""
    left, right = 0, len(values) - 1
    total = 0
    while left < right:
        if values[left] + values[right] <= target:
            total += right - left
            left += 1
        else:
            right -= 1
    return total


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        sys.stdout.write("0\n")
        return

    try:
        n = int(data[0])
        if n < 0 or len(data) < n + 2:
            sys.stdout.write("0\n")
            return
        values = [int(token) for token in data[1 : n + 1]]
        target = int(data[n + 1])
    except ValueError:
        sys.stdout.write("0\n")
        return

    sys.stdout.write("{}\n".format(count_pairs(values, target)))


if __name__ == "__main__":
    main()
