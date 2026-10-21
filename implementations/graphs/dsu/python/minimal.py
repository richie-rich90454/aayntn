"""A disjoint set over the elements 0..n-1.

Union by size keeps the trees shallow and path compression flattens them, so
the two together make every operation take amortised constant time.
"""


class DisjointSet:
    """A disjoint set over the elements 0..n-1.

    The instance owns its parent and size lists, so they are released together
    with the instance.
    """

    def __init__(self, n):
        count = n if n > 0 else 0
        self.parent = list(range(count))
        self.size = [1] * count

    def find(self, x):
        """The representative of the set holding x, compressing the path to it."""
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        # Every element on the path now points at the root.
        while self.parent[x] != x:
            nxt = self.parent[x]
            self.parent[x] = root
            x = nxt
        return root

    def unite(self, a, b):
        """Merge the sets holding a and b."""
        root_a = self.find(a)
        root_b = self.find(b)
        if root_a == root_b:
            return
        # The larger set absorbs the smaller one, which keeps the trees shallow.
        if self.size[root_a] < self.size[root_b]:
            root_a, root_b = root_b, root_a
        self.parent[root_b] = root_a
        self.size[root_a] += self.size[root_b]

    def same(self, a, b):
        """Whether a and b belong to the same set."""
        return self.find(a) == self.find(b)


def _self_check():
    """Assert the documented contract; the class above is the reusable part."""
    groups = DisjointSet(5)
    groups.unite(0, 1)
    groups.unite(2, 3)
    assert groups.same(0, 1)
    assert not groups.same(0, 2)
    assert not groups.same(0, 3)
    assert groups.find(0) == groups.find(1)
    assert groups.find(0) != groups.find(2)
    groups.unite(1, 3)
    assert groups.same(0, 3)
    assert groups.same(2, 3)
    assert not groups.same(0, 4)


if __name__ == "__main__":
    _self_check()
