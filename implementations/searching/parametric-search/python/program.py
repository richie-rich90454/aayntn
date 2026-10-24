"""Parametric search driver.

Reads n, n nonnegative values and a budget. Prints the largest level x whose
capped sum, the sum of min(a[i], x), is at most the budget.
"""

import sys


def feasible(values, level, budget):
    """Whether the capped sum at ``level`` fits in ``budget``."""
    total = 0
    for value in values:
        total += value if value < level else level
        if total > budget:
            return False
    return True


def main():
    tokens = sys.stdin.buffer.read().split()
    if not tokens:
        sys.stdout.write("0\n")
        return

    n = int(tokens[0])
    if n <= 0 or len(tokens) < n + 2:
        sys.stdout.write("0\n")
        return

    values = [int(token) for token in tokens[1 : n + 1]]
    budget = int(tokens[n + 1])

    lo = 0
    hi = max(values)
    answer = 0
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if feasible(values, mid, budget):
            answer = mid
            lo = mid + 1
        else:
            hi = mid - 1

    sys.stdout.write("{}\n".format(answer))


if __name__ == "__main__":
    main()
