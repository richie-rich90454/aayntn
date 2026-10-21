"""A disjoint set over the elements 0..n-1, driven by the operations read from
standard input.

Input: n q, then q operations. "1 u v" merges the sets of u and v and "2 u v"
queries whether u and v are in the same set.
Output: one line per query, holding yes or no.
"""

import sys


class DisjointSet:
    """A disjoint set over the elements 0..n-1.

    Union by size keeps the trees shallow and path compression flattens them,
    so the two together make every operation take amortised constant time.
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


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    q = int(data[1])
    if q < 0:
        q = 0

    groups = DisjointSet(n)
    out = []
    index = 2
    for _ in range(q):
        if index + 2 >= len(data):
            break
        op = int(data[index])
        u = int(data[index + 1])
        v = int(data[index + 2])
        index += 3
        valid = 0 <= u < n and 0 <= v < n
        if op == 1:
            if valid:
                groups.unite(u, v)
        elif op == 2:
            out.append("yes\n" if valid and groups.same(u, v) else "no\n")

    # The line feeds are written as bytes, so the text layer of Windows cannot
    # turn them into "\r\n" and the language variants stay byte-identical.
    sys.stdout.buffer.write("".join(out).encode())


if __name__ == "__main__":
    main()
