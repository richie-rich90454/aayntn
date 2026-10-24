"""Persistent segment tree over the compressed values of a static array.

Version i is the frequency tree of a[0..i), built from version i - 1 by copying
only the root-to-leaf path of the inserted value. The difference between
version r and version l - 1 is the frequency tree of a[l-1..r), so one descent
that subtracts the two left counts returns the k-th smallest.

Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
bounds. Output: one line per query, holding the k-th smallest value in a[l..r].
"""

import sys
from bisect import bisect_left


def solve():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    cursor = 0
    n = data[cursor]
    cursor += 1
    q = data[cursor]
    cursor += 1
    if n <= 0:
        return

    values = data[cursor : cursor + n]
    cursor += n

    ordered = sorted(set(values))
    m = len(ordered)
    depth = (m - 1).bit_length()

    capacity = (n + 1) * (depth + 2) + 1
    left_child = [0] * capacity
    right_child = [0] * capacity
    count = [0] * capacity
    nodes = 0

    def update(previous, low, high, position):
        nonlocal nodes
        nodes += 1
        node = nodes
        left_child[node] = left_child[previous]
        right_child[node] = right_child[previous]
        count[node] = count[previous] + 1
        if low < high:
            middle = (low + high) // 2
            if position <= middle:
                left_child[node] = update(left_child[previous], low, middle, position)
            else:
                right_child[node] = update(right_child[previous], middle + 1, high, position)
        return node

    roots = [0] * (n + 1)
    for i in range(1, n + 1):
        position = bisect_left(ordered, values[i - 1]) + 1
        roots[i] = update(roots[i - 1], 1, m, position)

    answers = []
    for _ in range(q):
        left = data[cursor]
        cursor += 1
        right = data[cursor]
        cursor += 1
        k = data[cursor]
        cursor += 1

        before = roots[left - 1]
        after = roots[right]
        low = 1
        high = m
        while low < high:
            middle = (low + high) // 2
            in_left = count[left_child[after]] - count[left_child[before]]
            if k <= in_left:
                before = left_child[before]
                after = left_child[after]
                high = middle
            else:
                k -= in_left
                before = right_child[before]
                after = right_child[after]
                low = middle + 1
        answers.append(str(ordered[low - 1]))

    if answers:
        sys.stdout.write("\n".join(answers) + "\n")


if __name__ == "__main__":
    solve()
