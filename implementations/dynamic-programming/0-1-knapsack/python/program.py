"""0/1 knapsack read from standard input.

Input: n W, then n lines w v.
Output: the maximum achievable total value, on one line.
"""

import sys


def knapsack_max_value(weights, values, capacity):
    """Return the largest total value that fits in capacity.

    weights holds the weight of every item and values the matching value.
    """
    if capacity < 0:
        return 0

    table = [0] * (capacity + 1)
    for index in range(min(len(weights), len(values))):
        weight = max(0, weights[index])

        # The capacity must run downwards: table[c - weight] has to still hold
        # the answer for the items before this one. With an upwards sweep that
        # cell would already include this item, so the item would be counted
        # more than once and the table would solve the unbounded knapsack.
        for c in range(capacity, weight - 1, -1):
            candidate = table[c - weight] + values[index]
            if candidate > table[c]:
                table[c] = candidate

    return table[capacity]


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    capacity = max(0, int(data[1]))

    weights = []
    values = []
    index = 2
    for _ in range(n):
        if index + 1 >= len(data):
            break
        weights.append(int(data[index]))
        values.append(int(data[index + 1]))
        index += 2

    sys.stdout.write(str(knapsack_max_value(weights, values, capacity)) + "\n")


if __name__ == "__main__":
    main()
