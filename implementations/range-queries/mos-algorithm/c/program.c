#include <stdio.h>
#include <stdlib.h>

/*
 * Mo's algorithm over a static array. The queries are sorted by the block of
 * the left endpoint, the right endpoint alternates direction between blocks,
 * and one window is moved from query to query. The maintained answer is the
 * number of distinct values in the window.
 */

typedef struct {
    int l;
    int r;
    int id;
    int block;
} query;

static int compare_ints(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

static int compare_queries(const void *a, const void *b) {
    const query *x = (const query *)a;
    const query *y = (const query *)b;
    if (x->block != y->block) {
        return x->block < y->block ? -1 : 1;
    }
    if ((x->block & 1) == 0) {
        return (x->r > y->r) - (x->r < y->r);
    }
    return (x->r < y->r) - (x->r > y->r);
}

/* The first position whose value is not less than the target. */
static int lower_bound(const int *values, int count, int target) {
    int lo = 0;
    int hi = count;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (q < 0) {
        q = 0;
    }

    int array_count = n > 0 ? n : 1;
    int *a = malloc((size_t)array_count * sizeof *a);
    int *sorted = malloc((size_t)array_count * sizeof *sorted);
    int *rank = malloc((size_t)array_count * sizeof *rank);
    if (a == NULL || sorted == NULL || rank == NULL) {
        free(a);
        free(sorted);
        free(rank);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%d", &a[i]) != 1) {
            a[i] = 0;
        }
        sorted[i] = a[i];
    }

    if (n > 0) {
        qsort(sorted, (size_t)n, sizeof *sorted, compare_ints);
    }
    int distinct_values = 0;
    for (int i = 0; i < n; i++) {
        if (i == 0 || sorted[i] != sorted[i - 1]) {
            sorted[distinct_values] = sorted[i];
            distinct_values++;
        }
    }
    for (int i = 0; i < n; i++) {
        rank[i] = lower_bound(sorted, distinct_values, a[i]);
    }

    int block = 1;
    while ((long long)(block + 1) * (block + 1) <= n) {
        block++;
    }

    int query_count = q > 0 ? q : 1;
    query *queries = malloc((size_t)query_count * sizeof *queries);
    int *answers = malloc((size_t)query_count * sizeof *answers);
    if (queries == NULL || answers == NULL) {
        free(a);
        free(sorted);
        free(rank);
        free(queries);
        free(answers);
        return 0;
    }

    for (int k = 0; k < q; k++) {
        int l = 1;
        int r = 1;
        if (scanf("%d %d", &l, &r) != 2) {
            l = 1;
            r = 1;
        }
        queries[k].l = l;
        queries[k].r = r;
        queries[k].id = k;
        queries[k].block = (l - 1) / block;
        answers[k] = 0;
    }

    if (q > 0) {
        qsort(queries, (size_t)q, sizeof *queries, compare_queries);
    }

    int *frequency = calloc((size_t)distinct_values + 1, sizeof *frequency);
    if (frequency == NULL) {
        free(a);
        free(sorted);
        free(rank);
        free(queries);
        free(answers);
        return 0;
    }

    int cur_left = 1;
    int cur_right = 0;
    int distinct = 0;

    for (int k = 0; k < q; k++) {
        int l = queries[k].l;
        int r = queries[k].r;

        while (cur_left > l) {
            cur_left--;
            int value = rank[cur_left - 1];
            if (frequency[value] == 0) {
                distinct++;
            }
            frequency[value]++;
        }
        while (cur_right < r) {
            cur_right++;
            int value = rank[cur_right - 1];
            if (frequency[value] == 0) {
                distinct++;
            }
            frequency[value]++;
        }
        while (cur_left < l) {
            int value = rank[cur_left - 1];
            frequency[value]--;
            if (frequency[value] == 0) {
                distinct--;
            }
            cur_left++;
        }
        while (cur_right > r) {
            int value = rank[cur_right - 1];
            frequency[value]--;
            if (frequency[value] == 0) {
                distinct--;
            }
            cur_right--;
        }

        answers[queries[k].id] = distinct;
    }

    for (int k = 0; k < q; k++) {
        printf("%d\n", answers[k]);
    }

    free(frequency);
    free(queries);
    free(answers);
    free(rank);
    free(sorted);
    free(a);
    return 0;
}
