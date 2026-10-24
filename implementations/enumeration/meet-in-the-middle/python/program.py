"""Count the subsets whose sum is at most a limit with meet in the middle.

Input: n W, then n integers.
Output: one line holding the number of subsets whose sum is at most W.
"""

import sys
from bisect import bisect_right


def subset_sums(values):
    """Return one sum per subset of values, including the empty subset."""
    sums = [0]
    for value in values:
        sums += [total + value for total in sums]
    return sums


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return
    n, limit = data[0], data[1]
    values = data[2 : 2 + n]

    middle = n // 2
    left = subset_sums(values[:middle])
    right = subset_sums(values[middle:])
    right.sort()

    answer = 0
    for value in left:
        answer += bisect_right(right, limit - value)
    print(answer)


if __name__ == "__main__":
    main()
