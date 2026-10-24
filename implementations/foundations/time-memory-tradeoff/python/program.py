"""A block-prefix table over a static array, driven from standard input.

Input: n, then n scores, then q, then q pairs l r.
Output: one line per query, holding the sum a_l + ... + a_r.
"""

import sys
from math import isqrt


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    if n < 1:
        return

    inside = [0] * (n + 1)
    index = 1
    for i in range(1, n + 1):
        inside[i] = data[index]
        index += 1

    block = max(1, isqrt(n))
    blocks = (n + block - 1) // block
    base = [0] * (blocks + 1)

    total = 0
    for b in range(blocks):
        base[b] = total
        run = 0
        start = b * block + 1
        end = min(n, start + block - 1)
        for i in range(start, end + 1):
            run += inside[i]
            inside[i] = run
        total += run
    base[blocks] = total

    q = data[index]
    index += 1
    lines = []
    for _ in range(q):
        left = data[index]
        right = data[index + 1]
        index += 2
        prefix_right = 0 if right == 0 else base[(right - 1) // block] + inside[right]
        before = left - 1
        prefix_left = 0 if before == 0 else base[(before - 1) // block] + inside[before]
        lines.append(str(prefix_right - prefix_left))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
