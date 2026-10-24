"""The aliens trick for splitting an array into exactly k contiguous groups.

Input: n k, then n nonnegative integers.
Output: the minimum possible sum of squared group sums.

A group that spans prefix positions j + 1 .. i contributes
(prefix[i] - prefix[j]) ** 2.  Charging a penalty for every group removes the
group count from the state, and a binary search over the penalty recovers the
answer for exactly k groups.
"""

import sys


def penalized(prefix, n, penalty):
    """Return (best penalized value, number of groups) for one penalty.

    The transition is a line query:
        value[j] + (x - prefix[j]) ** 2 + penalty
      = (-2 * prefix[j]) * x + value[j] + prefix[j] ** 2 + x * x + penalty.
    A Li Chao tree evaluates it in O(log n).  On equal values the line with the
    larger group count wins, so the binary search sees the right endpoint of a
    flat segment of the convex cost sequence.
    """
    size = 4 * (n + 1) + 8
    present = [False] * size
    slope = [0] * size
    intercept = [0] * size
    groups = [0] * size

    def better(m1, b1, c1, m2, b2, c2, x):
        left = m1 * x + b1
        right = m2 * x + b2
        if left != right:
            return left < right
        return c1 > c2

    def insert(node, left, right, m, b, c):
        if not present[node]:
            present[node] = True
            slope[node] = m
            intercept[node] = b
            groups[node] = c
            return
        mid = (left + right) // 2
        if better(m, b, c, slope[node], intercept[node], groups[node], prefix[mid]):
            slope[node], m = m, slope[node]
            intercept[node], b = b, intercept[node]
            groups[node], c = c, groups[node]
        if left == right:
            return
        if better(m, b, c, slope[node], intercept[node], groups[node], prefix[left]):
            insert(2 * node, left, mid, m, b, c)
        elif better(m, b, c, slope[node], intercept[node], groups[node], prefix[right]):
            insert(2 * node + 1, mid + 1, right, m, b, c)

    def query(index):
        node = 1
        left = 0
        right = n
        x = prefix[index]
        best = None
        while True:
            if present[node]:
                candidate = (slope[node] * x + intercept[node], -groups[node])
                if best is None or candidate < best:
                    best = candidate
            if left == right:
                break
            mid = (left + right) // 2
            if index <= mid:
                node *= 2
                right = mid
            else:
                node = 2 * node + 1
                left = mid + 1
        return best

    insert(1, 0, n, 0, 0, 0)
    value = 0
    count = 0
    for i in range(1, n + 1):
        x = prefix[i]
        line_value, negative_count = query(i)
        value = line_value + x * x + penalty
        count = -negative_count + 1
        insert(1, 0, n, -2 * x, value + x * x, count)
    return value, count


def solve(n, k, values):
    prefix = [0] * (n + 1)
    for i, value in enumerate(values[:n], 1):
        prefix[i] = prefix[i - 1] + value

    total = prefix[n]
    low = 0
    high = total * total + 1
    while low < high:
        mid = (low + high + 1) // 2
        _, count = penalized(prefix, n, mid)
        if count >= k:
            low = mid
        else:
            high = mid - 1

    value, _ = penalized(prefix, n, low)
    return value - low * k


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return
    n = data[0]
    k = data[1]
    if n <= 0:
        print(0)
        return
    k = min(max(k, 1), n)
    print(solve(n, k, data[2:]))


if __name__ == "__main__":
    main()
