"""A merge sort tree over a static array, driven from standard input.

Every node of a segment tree stores the sorted values of its interval, and a
rank query binary searches the O(log n) nodes that partition the requested
range.

Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
bounds. Output: one line per query, holding the k-th smallest value in a[l..r].
"""

import sys
from bisect import bisect_right


def merge(left, right):
    """The sorted merge of two sorted lists, the merge sort step of the tree."""
    merged = [0] * (len(left) + len(right))
    i = 0
    j = 0
    k = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged[k] = left[i]
            i += 1
        else:
            merged[k] = right[j]
            j += 1
        k += 1
    while i < len(left):
        merged[k] = left[i]
        i += 1
        k += 1
    while j < len(right):
        merged[k] = right[j]
        j += 1
        k += 1
    return merged


def count_at_most(tree, size, left, right, limit):
    """The number of positions in [left, right) whose value is at most limit."""
    total = 0
    l = left + size
    r = right + size
    while l < r:
        if l & 1:
            total += bisect_right(tree[l], limit)
            l += 1
        if r & 1:
            r -= 1
            total += bisect_right(tree[r], limit)
        l >>= 1
        r >>= 1
    return total


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    q = int(data[1])
    if n <= 0:
        return

    values = [int(token) for token in data[2 : 2 + n]]

    size = 1
    while size < n:
        size *= 2

    tree = [None] * (2 * size)
    for i, value in enumerate(values):
        tree[size + i] = [value]
    for i in range(size - 1, 0, -1):
        left = tree[2 * i]
        right = tree[2 * i + 1]
        if left is None:
            tree[i] = right
        elif right is None:
            tree[i] = left
        else:
            tree[i] = merge(left, right)

    minimum = min(values)
    maximum = max(values)

    index = 2 + n
    lines = []
    for _ in range(q):
        if index + 2 >= len(data):
            break
        left = int(data[index]) - 1
        right = int(data[index + 1])
        k = int(data[index + 2])
        index += 3

        # The least value whose rank in the range reaches k is the k-th
        # smallest, and the rank is monotone in the value.
        low = minimum
        high = maximum
        while low < high:
            middle = low + (high - low) // 2
            if count_at_most(tree, size, left, right, middle) >= k:
                high = middle
            else:
                low = middle + 1
        lines.append(str(low))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
