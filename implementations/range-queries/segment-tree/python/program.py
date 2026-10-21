"""A segment tree over a 1-indexed array of n values, driven from standard input.

Input: n q, then q operations. "1 i v" assigns the value v to the 1-based
position i, and "2 l r" queries the sum over the inclusive range [l, r].
Output: one line per query, holding the range sum.
"""

import sys


class SegmentTree:
    """A segment tree over a 1-indexed array of n values.

    tree[node] holds the sum of the values of the range that the node covers,
    so every node caches the result of merging its two children.

    The instance owns its list, so the tree is reclaimed with the object.
    """

    def __init__(self, values):
        """Build the tree over the values of the positions 1..n.

        values[0] holds the value of the position 1.
        """
        self.n = len(values)
        self.tree = [0] * (4 * self.n + 4)
        if self.n > 0:
            self._build(1, 1, self.n, values)

    def set(self, index, value):
        """Assign the value at the 1-based index; an index outside 1..n is ignored."""
        if index < 1 or index > self.n:
            return
        self._assign(1, 1, self.n, index, value)

    def range_sum(self, left, right):
        """The sum of the positions left..right, both inclusive."""
        left = max(left, 1)
        right = min(right, self.n)
        if left > right:
            return 0
        return self._query(1, 1, self.n, left, right)

    def _build(self, node, lo, hi, values):
        """Fill the subtree of node, which covers the positions lo..hi."""
        if lo == hi:
            self.tree[node] = values[lo - 1]
            return
        mid = lo + (hi - lo) // 2
        self._build(node * 2, lo, mid, values)
        self._build(node * 2 + 1, mid + 1, hi, values)
        self.tree[node] = self.tree[node * 2] + self.tree[node * 2 + 1]

    def _assign(self, node, lo, hi, index, value):
        """Assign the value at the 1-based index inside the subtree of node."""
        if lo == hi:
            self.tree[node] = value
            return
        mid = lo + (hi - lo) // 2
        if index <= mid:
            self._assign(node * 2, lo, mid, index, value)
        else:
            self._assign(node * 2 + 1, mid + 1, hi, index, value)
        # Merging the two children restores the invariant of the node.
        self.tree[node] = self.tree[node * 2] + self.tree[node * 2 + 1]

    def _query(self, node, lo, hi, left, right):
        """The sum of the positions left..right inside the subtree of node."""
        if right < lo or hi < left:
            # The queried range and the subtree do not overlap.
            return 0
        if left <= lo and hi <= right:
            return self.tree[node]
        mid = lo + (hi - lo) // 2
        return self._query(node * 2, lo, mid, left, right) + self._query(
            node * 2 + 1, mid + 1, hi, left, right
        )


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))

    # Every position starts at zero, because the input carries no values.
    tree = SegmentTree([0] * n)

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
            tree.set(first, second)
        else:
            lines.append(str(tree.range_sum(first, second)))

    if lines:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
