"""A Fenwick tree (binary indexed tree) over a 1-indexed array."""


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


def _self_check():
    """Assert the documented contract; the class above is the reusable part."""
    tree = Fenwick(5)
    tree.add(1, 5)
    tree.add(2, 3)
    assert tree.prefix_sum(2) == 8
    assert tree.range_sum(1, 2) == 8
    assert tree.range_sum(1, 5) == 8
    assert tree.range_sum(3, 5) == 0
    # A negative delta removes value, and the empty prefix sums to zero.
    tree.add(2, -3)
    assert tree.range_sum(1, 5) == 5
    assert tree.prefix_sum(0) == 0


if __name__ == "__main__":
    _self_check()
