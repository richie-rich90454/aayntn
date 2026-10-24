import sys

NONE = -1


class SegmentTreeBeats:
    """Range chmin and range sum over a 1-indexed array.

    The tree stores, for every node, the sum of its range, its largest value,
    the second largest distinct value, and how many positions hold the largest
    value. A cap strictly between the two largest values changes only the
    largest group, so the node absorbs it in constant time.
    """

    def __init__(self, values):
        self.n = len(values) - 1
        size = 4 * self.n + 4
        self.total = [0] * size
        self.max1 = [0] * size
        self.max2 = [NONE] * size
        self.count = [0] * size
        if self.n > 0:
            self._build(1, 1, self.n, values)

    @staticmethod
    def _max64(a, b):
        return a if a > b else b

    def _pull(self, node):
        left = node * 2
        right = left + 1
        self.total[node] = self.total[left] + self.total[right]
        if self.max1[left] == self.max1[right]:
            self.max1[node] = self.max1[left]
            self.count[node] = self.count[left] + self.count[right]
            self.max2[node] = self._max64(self.max2[left], self.max2[right])
        elif self.max1[left] > self.max1[right]:
            self.max1[node] = self.max1[left]
            self.count[node] = self.count[left]
            self.max2[node] = self._max64(self.max2[left], self.max1[right])
        else:
            self.max1[node] = self.max1[right]
            self.count[node] = self.count[right]
            self.max2[node] = self._max64(self.max1[left], self.max2[right])

    def _apply_cap(self, node, x):
        # The caller guarantees max2 < x < max1, so only the maximum moves.
        if self.max1[node] <= x:
            return
        self.total[node] -= (self.max1[node] - x) * self.count[node]
        self.max1[node] = x

    def _push(self, node):
        # The child's second maximum is at most the parent's second maximum,
        # which the stored cap exceeded, so the child absorbs it at once.
        self._apply_cap(node * 2, self.max1[node])
        self._apply_cap(node * 2 + 1, self.max1[node])

    def _build(self, node, lo, hi, values):
        if lo == hi:
            self.total[node] = values[lo]
            self.max1[node] = values[lo]
            self.max2[node] = NONE
            self.count[node] = 1
            return
        mid = lo + (hi - lo) // 2
        self._build(node * 2, lo, mid, values)
        self._build(node * 2 + 1, mid + 1, hi, values)
        self._pull(node)

    def _chmin(self, node, lo, hi, left, right, x):
        if right < lo or hi < left or self.max1[node] <= x:
            return
        if left <= lo and hi <= right and self.max2[node] < x:
            self._apply_cap(node, x)
            return
        if lo == hi:
            self._apply_cap(node, x)
            return
        self._push(node)
        mid = lo + (hi - lo) // 2
        self._chmin(node * 2, lo, mid, left, right, x)
        self._chmin(node * 2 + 1, mid + 1, hi, left, right, x)
        self._pull(node)

    def _range_sum(self, node, lo, hi, left, right):
        if right < lo or hi < left:
            return 0
        if left <= lo and hi <= right:
            return self.total[node]
        self._push(node)
        mid = lo + (hi - lo) // 2
        return self._range_sum(node * 2, lo, mid, left, right) + self._range_sum(
            node * 2 + 1, mid + 1, hi, left, right
        )

    def range_chmin(self, left, right, x):
        if self.n > 0:
            self._chmin(1, 1, self.n, left, right, x)

    def range_sum(self, left, right):
        if self.n == 0:
            return 0
        return self._range_sum(1, 1, self.n, left, right)


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return
    n = int(data[0])
    q = int(data[1])
    if n <= 0:
        return

    values = [0] + [int(token) for token in data[2 : 2 + n]]
    tree = SegmentTreeBeats(values)

    index = 2 + n
    out = []
    for _ in range(q):
        if index >= len(data):
            break
        kind = int(data[index])
        index += 1
        if kind == 1:
            left = int(data[index])
            right = int(data[index + 1])
            x = int(data[index + 2])
            index += 3
            tree.range_chmin(left, right, x)
        elif kind == 2:
            left = int(data[index])
            right = int(data[index + 1])
            index += 2
            out.append(str(tree.range_sum(left, right)))
        else:
            break

    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
