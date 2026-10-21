#include <algorithm>
#include <vector>

/**
 * Maximum total value of a subset of the items whose total weight is at most
 * capacity.
 *
 * @param weights  the weight of every item
 * @param values   the value of every item, parallel to weights
 * @param capacity the weight budget
 * @return the largest total value that fits in capacity
 */
long long knapsackMaxValue(const std::vector<int>& weights,
                            const std::vector<long long>& values,
                            int capacity) {
    if (capacity < 0) {
        return 0;
    }

    std::vector<long long> table(static_cast<size_t>(capacity) + 1, 0);

    const size_t n = std::min(weights.size(), values.size());
    for (size_t i = 0; i < n; ++i) {
        const int weight = std::max(0, weights[i]);

        // The capacity must run downwards: table[c - weight] has to still hold
        // the answer for the items before item i. With an upwards sweep that
        // cell would already include item i, so the item would be counted
        // more than once and the table would solve the unbounded knapsack.
        for (int c = capacity; c >= weight; --c) {
            table[static_cast<size_t>(c)] =
                std::max(table[static_cast<size_t>(c)],
                         table[static_cast<size_t>(c - weight)] + values[i]);
        }
    }

    return table[static_cast<size_t>(capacity)];
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main() {
    const std::vector<int> weights{3, 4, 5, 2};
    const std::vector<long long> values{4, 5, 7, 3};

    if (knapsackMaxValue(weights, values, 7) != 10) {
        return 1;
    }

    // An item that fits twice is still worth its value only once.
    if (knapsackMaxValue(std::vector<int>{2}, std::vector<long long>{3}, 4) != 3) {
        return 1;
    }

    // An item heavier than the budget is never taken.
    if (knapsackMaxValue(std::vector<int>{5}, std::vector<long long>{9}, 4) != 0) {
        return 1;
    }

    // No items at all.
    if (knapsackMaxValue(std::vector<int>{}, std::vector<long long>{}, 7) != 0) {
        return 1;
    }

    return 0;
}
