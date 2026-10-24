"""Matrix chain multiplication with the monotone split window.

Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
p[i] by p[i + 1], for 0 <= i < n.
Output: the minimum number of scalar multiplications.

The split for a range [i, j] is only searched in
[opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic interval
table into a quadratic one.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n <= 0:
        print(0)
        return

    p = [int(value) for value in data[1 : n + 2]]
    if len(p) < n + 1:
        p.extend([1] * (n + 1 - len(p)))

    dp = [[0] * n for _ in range(n)]
    opt = [[0] * n for _ in range(n)]
    for i in range(n):
        opt[i][i] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            lo = opt[i][j - 1]
            hi = opt[i + 1][j]
            if lo < i:
                lo = i
            if hi > j - 1:
                hi = j - 1
            if lo > hi:
                lo = i
                hi = j - 1

            best = -1
            best_k = lo
            left = p[i]
            right = p[j + 1]
            for k in range(lo, hi + 1):
                cost = dp[i][k] + dp[k + 1][j] + left * p[k + 1] * right
                if best < 0 or cost < best:
                    best = cost
                    best_k = k
            dp[i][j] = best
            opt[i][j] = best_k

    print(dp[0][n - 1])


if __name__ == "__main__":
    main()
