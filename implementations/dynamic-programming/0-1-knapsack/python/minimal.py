"""0/1 knapsack: the maximum total value of a subset of the items whose total
weight fits in a capacity, where every item may be taken at most once.
"""


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


def _self_check():
    """Assert the documented contract; the routine above is the reusable part."""
    weights = [3, 4, 5, 2]
    values = [4, 5, 7, 3]
    assert knapsack_max_value(weights, values, 7) == 10
    # An item that fits twice is still worth its value only once.
    assert knapsack_max_value([2], [3], 4) == 3
    # An item heavier than the budget is never taken.
    assert knapsack_max_value([5], [9], 4) == 0
    # No items at all.
    assert knapsack_max_value([], [], 7) == 0


if __name__ == "__main__":
    _self_check()
