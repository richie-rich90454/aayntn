#include <stdlib.h>

/**
 * Maximum total value of a subset of the items whose total weight is at most
 * capacity.
 *
 * weights   the weight of every item
 * values    the value of every item, parallel to weights
 * n         number of items
 * capacity  the weight budget
 * table     scratch space with room for capacity + 1 entries; the function
 *           writes the best value for every capacity into it and never
 *           allocates, so the caller keeps ownership of the buffer
 * returns   the largest total value that fits in capacity
 */
long long knapsack_max_value(const int *weights, const long long *values,
                              int n, int capacity, long long *table) {
    for (int c = 0; c <= capacity; c++) {
        table[c] = 0;
    }

    for (int i = 0; i < n; i++) {
        const int weight = weights[i] < 0 ? 0 : weights[i];

        /* The capacity must run downwards: table[c - weight] has to still hold
           the answer for the items before item i. With an upwards sweep that
           cell would already include item i, so the item would be counted
           more than once and the table would solve the unbounded knapsack. */
        for (int c = capacity; c >= weight; c--) {
            const long long candidate = table[c - weight] + values[i];
            if (candidate > table[c]) {
                table[c] = candidate;
            }
        }
    }

    return table[capacity];
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    long long table[8];
    const int weights[] = {3, 4, 5, 2};
    const long long values[] = {4, 5, 7, 3};

    if (knapsack_max_value(weights, values, 4, 7, table) != 10) {
        return EXIT_FAILURE;
    }
    if (table[2] != 3) {
        return EXIT_FAILURE;
    }

    /* An item that fits twice is still worth its value only once. */
    const int one_weight[] = {2};
    const long long one_value[] = {3};
    if (knapsack_max_value(one_weight, one_value, 1, 4, table) != 3) {
        return EXIT_FAILURE;
    }

    /* An item heavier than the budget is never taken. */
    const int heavy_weight[] = {5};
    const long long heavy_value[] = {9};
    if (knapsack_max_value(heavy_weight, heavy_value, 1, 4, table) != 0) {
        return EXIT_FAILURE;
    }

    /* No items at all. */
    if (knapsack_max_value(weights, values, 0, 7, table) != 0) {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
