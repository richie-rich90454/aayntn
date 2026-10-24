"""Square-root decomposition over a 1-indexed array, driven from standard input.

Input: n q, then q operations. "1 i delta" adds delta to the value at the
1-based index i, and "2 l r" queries the sum over the inclusive range [l, r].
Output: one line per query, holding the range sum.
"""

import sys


class SqrtDecomposition:
    """An array cut into blocks of about sqrt(n) positions.

    sum[b] holds the total of block b, so a point update changes one value and
    one block, while a range query reads whole blocks in one step each and
    scans only the two partial blocks at the ends.
    """

    def __init__(self, n):
        self.n = n
        self.block = 1
        while self.block * self.block < n:
            self.block += 1
        blocks = (n + self.block - 1) // self.block
        self.value = [0] * n
        self.sum = [0] * blocks

    def add(self, index, delta):
        """Add delta to the value at the 1-based index."""
        index -= 1
        if 0 <= index < self.n:
            self.value[index] += delta
            self.sum[index // self.block] += delta

    def range_sum(self, left, right):
        """The sum of the positions left..right, both inclusive."""
        left -= 1
        right -= 1
        if left < 0:
            left = 0
        if right >= self.n:
            right = self.n - 1
        if left > right:
            return 0

        first_full = (left + self.block - 1) // self.block
        last_full = (right + 1) // self.block - 1
        if first_full > last_full:
            return sum(self.value[left : right + 1])

        total = sum(self.value[left : first_full * self.block])
        total += sum(self.sum[first_full : last_full + 1])
        total += sum(self.value[(last_full + 1) * self.block : right + 1])
        return total


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))
    array = SqrtDecomposition(n)

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
            array.add(first, second)
        else:
            lines.append(str(array.range_sum(first, second)))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
