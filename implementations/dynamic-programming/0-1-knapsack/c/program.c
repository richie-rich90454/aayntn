#include <stdio.h>
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
static long long knapsack_max_value(const int *weights, const long long *values,
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

int main(void) {
    int n = 0;
    int capacity = 0;
    if (scanf("%d %d", &n, &capacity) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (capacity < 0) {
        capacity = 0;
    }

    int *weights = NULL;
    long long *values = NULL;
    long long *table = malloc(((size_t)capacity + 1) * sizeof *table);
    if (n > 0) {
        weights = malloc((size_t)n * sizeof *weights);
        values = malloc((size_t)n * sizeof *values);
    }
    if (table == NULL || (n > 0 && (weights == NULL || values == NULL))) {
        free(weights);
        free(values);
        free(table);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < n; i++) {
        int weight = 0;
        long long value = 0;
        if (scanf("%d %lld", &weight, &value) != 2) {
            break;
        }
        weights[kept] = weight;
        values[kept] = value;
        kept++;
    }

    printf("%lld\n", knapsack_max_value(weights, values, kept, capacity, table));

    free(weights);
    free(values);
    free(table);
    return 0;
}
