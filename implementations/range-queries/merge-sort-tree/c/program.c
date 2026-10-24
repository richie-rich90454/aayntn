#include <stdio.h>
#include <stdlib.h>

/*
 * A merge sort tree over a static array: every node of a segment tree stores
 * the sorted values of its interval, and a rank query binary searches the
 * O(log n) nodes that partition the requested range.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

typedef struct {
    int length;
    long long *values;
} sorted_list;

/* The number of values in the list that are at most limit. */
static int upper_bound(const long long *values, int length, long long limit) {
    int low = 0;
    int high = length;
    while (low < high) {
        int middle = low + (high - low) / 2;
        if (values[middle] <= limit) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

static void merge_lists(const long long *left, int left_length, const long long *right,
                        int right_length, long long *merged) {
    int i = 0;
    int j = 0;
    int k = 0;
    while (i < left_length && j < right_length) {
        if (left[i] <= right[j]) {
            merged[k++] = left[i++];
        } else {
            merged[k++] = right[j++];
        }
    }
    while (i < left_length) {
        merged[k++] = left[i++];
    }
    while (j < right_length) {
        merged[k++] = right[j++];
    }
}

/* The number of positions in [left, right) whose value is at most limit. */
static long long count_at_most(const sorted_list *tree, int size, int left, int right,
                               long long limit) {
    long long total = 0;
    int l = left + size;
    int r = right + size;
    while (l < r) {
        if ((l & 1) != 0) {
            total += upper_bound(tree[l].values, tree[l].length, limit);
            l += 1;
        }
        if ((r & 1) != 0) {
            r -= 1;
            total += upper_bound(tree[r].values, tree[r].length, limit);
        }
        l >>= 1;
        r >>= 1;
    }
    return total;
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    long long *values = malloc((size_t)n * sizeof *values);
    if (values == NULL) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%lld", &values[i]) != 1) {
            free(values);
            return 0;
        }
    }

    int size = 1;
    while (size < n) {
        size *= 2;
    }

    sorted_list *tree = calloc((size_t)2 * size, sizeof *tree);
    if (tree == NULL) {
        free(values);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        sorted_list *leaf = &tree[size + i];
        leaf->length = 1;
        leaf->values = malloc(sizeof *leaf->values);
        if (leaf->values == NULL) {
            for (int j = 1; j < 2 * size; j++) {
                free(tree[j].values);
            }
            free(tree);
            free(values);
            return 0;
        }
        leaf->values[0] = values[i];
    }

    for (int i = size - 1; i >= 1; i--) {
        sorted_list *node = &tree[i];
        const sorted_list *left = &tree[2 * i];
        const sorted_list *right = &tree[2 * i + 1];
        node->length = left->length + right->length;
        if (node->length == 0) {
            continue;
        }
        node->values = malloc((size_t)node->length * sizeof *node->values);
        if (node->values == NULL) {
            for (int j = 1; j < 2 * size; j++) {
                free(tree[j].values);
            }
            free(tree);
            free(values);
            return 0;
        }
        merge_lists(left->values, left->length, right->values, right->length, node->values);
    }

    long long minimum = values[0];
    long long maximum = values[0];
    for (int i = 1; i < n; i++) {
        if (values[i] < minimum) {
            minimum = values[i];
        }
        if (values[i] > maximum) {
            maximum = values[i];
        }
    }

    for (int query = 0; query < q; query++) {
        int left = 0;
        int right = 0;
        long long k = 0;
        if (scanf("%d %d %lld", &left, &right, &k) != 3) {
            break;
        }

        /* The least value whose rank in the range reaches k is the k-th
         * smallest, and the rank is monotone in the value. */
        long long low = minimum;
        long long high = maximum;
        while (low < high) {
            long long middle = low + (high - low) / 2;
            if (count_at_most(tree, size, left - 1, right, middle) >= k) {
                high = middle;
            } else {
                low = middle + 1;
            }
        }
        printf("%lld\n", low);
    }

    for (int i = 1; i < 2 * size; i++) {
        free(tree[i].values);
    }
    free(tree);
    free(values);
    return 0;
}
