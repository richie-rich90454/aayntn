"""A Fenwick tree (binary indexed tree) over a 1-indexed array, driven from
standard input.

Input: n q, then q operations. "1 i delta" adds delta to the value at the
1-based index i, and "2 l r" queries the sum over the inclusive range [l, r].
Output: one line per query, holding the range sum.
"""

import sys


class Fenwick:
    """A Fenwick tree over a 1-indexed array.

    tree[i] holds the sum of the positions in the block (i - lowbit(i), i],
    where lowbit(i) is the largest power of two that divides i.
    """

    def __init__(self, n):
        self.n = n
        self.tree = [0] * (n + 1)

    def add(self, index, delta):
        """Add delta to the value at the 1-based index."""
        if index < 1:
            return
        # Stepping up by lowbit visits exactly the blocks that contain the index.
        while index <= self.n:
            self.tree[index] += delta
            index += index & -index

    def prefix_sum(self, index):
        """The sum of the positions 1..index."""
        index = min(index, self.n)
        total = 0
        # Stepping down by lowbit visits disjoint blocks that partition 1..index.
        while index > 0:
            total += self.tree[index]
            index -= index & -index
        return total

    def range_sum(self, left, right):
        """The sum of the positions left..right, both inclusive."""
        return self.prefix_sum(right) - self.prefix_sum(left - 1)


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))

    tree = Fenwick(n)

    index = 2
    lines = []
    for _ in range(q):
        if index >= len(data):
            break
        kind = int(data[index])
        index += 1
        if kind not in (1, 2):
            break
        if index + 1 >= len(data):
            break
        first = int(data[index])
        second = int(data[index + 1])
        index += 2
        if kind == 1:
            tree.add(first, second)
        else:
            lines.append(str(tree.range_sum(first, second)))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
