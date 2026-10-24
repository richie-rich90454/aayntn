#include <stdio.h>
#include <stdlib.h>

/* One record of three integer keys. */
typedef struct {
    int a;
    int b;
    int c;
} record;

/*
 * The required order: a ascending, then b descending, then c ascending.
 * Each key is compared directly rather than by subtracting the values, so no
 * difference can overflow, and the comparator returns zero only when all
 * three keys are equal.
 */
static int compare_records(const void *left, const void *right) {
    const record *x = left;
    const record *y = right;

    if (x->a != y->a) {
        return x->a < y->a ? -1 : 1;
    }
    if (x->b != y->b) {
        return x->b > y->b ? -1 : 1;
    }
    if (x->c != y->c) {
        return x->c < y->c ? -1 : 1;
    }
    return 0;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n <= 0) {
        return 0;
    }

    record *records = malloc((size_t)n * sizeof *records);
    if (records == NULL) {
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%d %d %d", &records[i].a, &records[i].b, &records[i].c) != 3) {
            free(records);
            return 0;
        }
    }

    qsort(records, (size_t)n, sizeof *records, compare_records);

    for (int i = 0; i < n; i++) {
        printf("%d %d %d\n", records[i].a, records[i].b, records[i].c);
    }

    free(records);
    return 0;
}
