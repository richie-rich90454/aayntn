#include <algorithm>
#include <iostream>
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
static long long knapsackMaxValue(const std::vector<int>& weights,
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

int main() {
    int n = 0;
    int capacity = 0;
    if (!(std::cin >> n >> capacity)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (capacity < 0) {
        capacity = 0;
    }

    std::vector<int> weights(static_cast<size_t>(n));
    std::vector<long long> values(static_cast<size_t>(n));
    int kept = 0;
    for (int i = 0; i < n; ++i) {
        int weight = 0;
        long long value = 0;
        if (!(std::cin >> weight >> value)) {
            break;
        }
        weights[static_cast<size_t>(kept)] = weight;
        values[static_cast<size_t>(kept)] = value;
        kept++;
    }
    weights.resize(static_cast<size_t>(kept));
    values.resize(static_cast<size_t>(kept));

    std::cout << knapsackMaxValue(weights, values, capacity) << '\n';
    return 0;
}
