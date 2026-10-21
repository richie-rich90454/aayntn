"""Prefix sums driver.

Reads n, the n array values, q and then q 1-based inclusive ranges from
standard input, and prints one range sum per line.
"""

import sys


def prefix_sums(a):
    """Return the running totals of the sequence ``a``."""
    prefix = [0] * (len(a) + 1)
    for i, value in enumerate(a):
        prefix[i + 1] = prefix[i] + value
    return prefix


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0:
        n = 0

    # The values start at zero, so a truncated input leaves zeros behind.
    a = []
    for i in range(n):
        if 1 + i < len(data):
            a.append(int(data[1 + i]))
        else:
            a.append(0)

    prefix = prefix_sums(a)

    q = 0
    if 1 + n < len(data):
        q = int(data[1 + n])
    if q < 0:
        q = 0

    index = 2 + n
    lines = []
    for _ in range(q):
        if index + 1 >= len(data):
            break
        l = int(data[index])
        r = int(data[index + 1])
        index += 2
        # A range that leaves the array is clipped, so the lookup stays in
        # bounds; a range that is empty after clipping sums to zero.
        if l < 1:
            l = 1
        if r > n:
            r = n
        if l > r:
            lines.append("0")
        else:
            lines.append(str(prefix[r] - prefix[l - 1]))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
