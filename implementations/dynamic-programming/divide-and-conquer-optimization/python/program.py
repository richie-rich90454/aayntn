"""The minimum total squared group sum for k contiguous nonempty groups.

Input: n k, then n integers.
Output: the minimum possible sum of squared group sums.

dp[g][i] = min over j < i of dp[g - 1][j] + (prefix[i] - prefix[j]) ** 2.
The best j never moves left as i grows, so the middle entry of a range is
solved directly and its optimal split point bounds both halves.
"""

import sys

INF = 10**30


def solve_layer(left, right, opt_left, opt_right, prefix, previous, current):
    if left > right:
        return

    mid = left + (right - left) // 2
    upper = min(opt_right, mid - 1)
    best = INF
    best_j = opt_left

    for j in range(opt_left, upper + 1):
        difference = prefix[mid] - prefix[j]
        candidate = previous[j] + difference * difference
        if candidate < best:
            best = candidate
            best_j = j

    current[mid] = best
    # The optimal split of mid bounds the candidates of both halves.
    solve_layer(left, mid - 1, opt_left, best_j, prefix, previous, current)
    solve_layer(mid + 1, right, best_j, opt_right, prefix, previous, current)


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    k = int(data[1])
    if n <= 0:
        sys.stdout.write("0\n")
        return
    if k < 1:
        k = 1
    if k > n:
        k = n

    prefix = [0] * (n + 1)
    for i in range(1, n + 1):
        value = int(data[i + 1]) if i + 1 < len(data) else 0
        prefix[i] = prefix[i - 1] + value

    previous = [INF] * (n + 1)
    current = [INF] * (n + 1)
    previous[0] = 0

    for g in range(1, k + 1):
        for i in range(n + 1):
            current[i] = INF
        # Layer g only needs prefixes that leave room for the remaining groups.
        last = n - k + g
        solve_layer(g, last, g - 1, last - 1, prefix, previous, current)
        previous, current = current, previous

    # An explicit byte output keeps the line ending identical on every platform.
    sys.stdout.buffer.write((str(previous[n]) + "\n").encode())


if __name__ == "__main__":
    main()
