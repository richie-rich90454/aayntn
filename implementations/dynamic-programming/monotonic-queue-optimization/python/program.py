"""Minimum cost path with hops of at most k positions.

Input: n k, then n integers a[1..n].
Output: dp[n], on one line.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        sys.stdout.write("0\n")
        return

    n = max(0, int(data[0]))
    k = max(1, int(data[1]))

    dp = [0] * (n + 1)
    # The deque holds indices with strictly increasing dp values, so the front
    # is the cheapest candidate inside the current window.
    deque = [0] * (n + 1)
    head = 0
    tail = 0
    deque[tail] = 0
    tail += 1
    kept = 0

    index = 2
    for i in range(1, n + 1):
        if index >= len(data):
            break
        value = int(data[index])
        index += 1

        # The window is [i - k, i - 1], so an index is stale only when it is
        # strictly smaller than i - k.
        while head < tail and deque[head] < i - k:
            head += 1

        dp[i] = value + dp[deque[head]]

        # An older index with a value no smaller than dp[i] can never be the
        # minimum again: i expires later and is at least as cheap.
        while head < tail and dp[deque[tail - 1]] >= dp[i]:
            tail -= 1
        deque[tail] = i
        tail += 1
        kept = i

    sys.stdout.write(str(dp[kept]) + "\n")


if __name__ == "__main__":
    main()
