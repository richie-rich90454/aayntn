"""A segment tree over a 1-indexed array of n values."""


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


def _self_check():
    """Assert the documented contract; the class above is the reusable part."""
    tree = SegmentTree([1, 2, 3, 4, 5])
    assert tree.range_sum(1, 5) == 15
    assert tree.range_sum(2, 4) == 9
    assert tree.range_sum(3, 3) == 3

    tree.set(3, 30)
    assert tree.range_sum(1, 5) == 42
    assert tree.range_sum(3, 5) == 39

    # A negative value is an ordinary value, and an empty range sums to 0.
    tree.set(1, -10)
    assert tree.range_sum(1, 5) == 31
    assert tree.range_sum(4, 2) == 0

    # An index outside the array is ignored.
    tree.set(9, 100)
    tree.set(0, 100)
    assert tree.range_sum(1, 5) == 31


if __name__ == "__main__":
    _self_check()
