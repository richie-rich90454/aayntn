"""A lazy segment tree over a 1-indexed array, driven from standard input.

Input: n q, then q operations. "1 l r delta" adds delta to every position in
the inclusive range [l, r], and "2 l r" queries the inclusive range sum. Every
position starts at zero.
Output: one line per query, holding the range sum.
"""

import sys


class LazySum:
    """A lazy segment tree supporting range addition and range sums.

    tree[node] holds the sum of the node's range, and lazy[node] holds the
    addition that has already been applied to tree[node] but not yet to its
    children.
    """

    def __init__(self, n):
        self.n = n
        self.tree = [0] * (4 * n + 4)
        self.lazy = [0] * (4 * n + 4)

    def _apply(self, node, lo, hi, delta):
        self.tree[node] += delta * (hi - lo + 1)
        self.lazy[node] += delta

    def _push(self, node, lo, hi):
        if self.lazy[node] == 0 or lo == hi:
            return
        mid = (lo + hi) // 2
        self._apply(node * 2, lo, mid, self.lazy[node])
        self._apply(node * 2 + 1, mid + 1, hi, self.lazy[node])
        self.lazy[node] = 0

    def _add(self, node, lo, hi, left, right, delta):
        if right < lo or hi < left:
            return
        if left <= lo and hi <= right:
            self._apply(node, lo, hi, delta)
            return
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        self._add(node * 2, lo, mid, left, right, delta)
        self._add(node * 2 + 1, mid + 1, hi, left, right, delta)
        self.tree[node] = self.tree[node * 2] + self.tree[node * 2 + 1]

    def _sum(self, node, lo, hi, left, right):
        if right < lo or hi < left:
            return 0
        if left <= lo and hi <= right:
            return self.tree[node]
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        return self._sum(node * 2, lo, mid, left, right) + self._sum(
            node * 2 + 1, mid + 1, hi, left, right
        )

    def range_add(self, left, right, delta):
        if self.n > 0:
            self._add(1, 1, self.n, left, right, delta)

    def range_sum(self, left, right):
        if self.n == 0:
            return 0
        return self._sum(1, 1, self.n, left, right)


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))
    tree = LazySum(n)

    index = 2
    lines = []
    for _ in range(q):
        if index >= len(data):
            break
        kind = int(data[index])
        index += 1
        if kind == 1:
            if index + 2 >= len(data):
                break
            left = int(data[index])
            right = int(data[index + 1])
            delta = int(data[index + 2])
            index += 3
            tree.range_add(left, right, delta)
        elif kind == 2:
            if index + 1 >= len(data):
                break
            left = int(data[index])
            right = int(data[index + 1])
            index += 2
            lines.append(str(tree.range_sum(left, right)))
        else:
            break

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
