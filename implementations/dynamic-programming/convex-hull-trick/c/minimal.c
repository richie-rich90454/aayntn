#include <stdlib.h>

/*
 * A monotone convex hull trick over the lines y = m * x + b: the lines are
 * added with a non-decreasing slope, the queries arrive with a non-decreasing
 * x, and the answer is the smallest value of the lines added so far.
 *
 * The hull is a stack of lines with increasing slopes. The line on top of the
 * stack is the one that is smallest for the smallest x, and a query walks
 * down the stack as the x grows.
 */
typedef struct {
    int size;
    int capacity;
    long long *slope;
    long long *intercept;
} convex_hull;

/*
 * Ownership: convex_hull_init allocates the storage and convex_hull_destroy
 * frees it. Every successful init must be matched by exactly one destroy, and
 * the hull must not be used after that destroy.
 */
int convex_hull_init(convex_hull *h, int capacity) {
    if (capacity < 0) {
        return 0;
    }
    h->size = 0;
    h->capacity = capacity;
    h->slope = malloc((size_t)(capacity > 0 ? capacity : 1) * sizeof *h->slope);
    h->intercept = malloc((size_t)(capacity > 0 ? capacity : 1) * sizeof *h->intercept);
    if (h->slope == NULL || h->intercept == NULL) {
        free(h->slope);
        free(h->intercept);
        h->slope = NULL;
        h->intercept = NULL;
        h->capacity = 0;
        return 0;
    }
    return 1;
}

void convex_hull_destroy(convex_hull *h) {
    free(h->slope);
    free(h->intercept);
    h->slope = NULL;
    h->intercept = NULL;
    h->size = 0;
    h->capacity = 0;
}

/*
 * True when the middle line of the three never holds the minimum: the
 * switch points of the neighbours have to decrease along the stack, and the
 * comparison is done on the switch points, so the products of the
 * coefficients never enter the arithmetic.
 */
static int convex_hull_redundant(long long m1, long long b1, long long m2,
                                 long long b2, long long m3, long long b3) {
    return (double)(b1 - b2) / (double)(m2 - m1) <=
           (double)(b2 - b3) / (double)(m3 - m2);
}

/*
 * Adds the line y = m * x + b. The slope must not be smaller than the slope
 * of the line added before, which is what makes the amortised cost of the
 * operations constant. Returns 0 when the hull is full.
 */
int convex_hull_add(convex_hull *h, long long m, long long b) {
    if (h->size == h->capacity) {
        return 0;
    }
    while (h->size > 0 && h->slope[h->size - 1] == m) {
        if (h->intercept[h->size - 1] <= b) {
            /* The new line is never the smallest, so it is dropped. */
            return 1;
        }
        /* The new line wins against the line with the same slope. */
        h->size--;
    }
    while (h->size >= 2 &&
           convex_hull_redundant(h->slope[h->size - 2], h->intercept[h->size - 2],
                                 h->slope[h->size - 1], h->intercept[h->size - 1], m, b)) {
        /* The line on top of the stack is never the smallest. */
        h->size--;
    }
    h->slope[h->size] = m;
    h->intercept[h->size] = b;
    h->size++;
    return 1;
}

/*
 * The smallest value of the lines added so far at the point x. The x values
 * must not decrease, which is what lets the query drop the lines it walks
 * past. The answer of a query with no line at all is 0.
 */
long long convex_hull_query(convex_hull *h, long long x) {
    if (h->size == 0) {
        return 0;
    }
    while (h->size >= 2) {
        const long long top = h->slope[h->size - 1] * x + h->intercept[h->size - 1];
        const long long below = h->slope[h->size - 2] * x + h->intercept[h->size - 2];
        if (below >= top) {
            break;
        }
        /*
         * The line on top of the stack has the larger slope, so it stays the
         * worse of the two for every larger x and is dropped for good.
         */
        h->size--;
    }
    return h->slope[h->size - 1] * x + h->intercept[h->size - 1];
}

/*
 * Self-check only: the routines above are the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    convex_hull hull;
    if (!convex_hull_init(&hull, 8)) {
        return EXIT_FAILURE;
    }

    convex_hull_add(&hull, 1, 0);
    convex_hull_add(&hull, 2, -1);
    /* The line 2x - 1 is never the smallest, so it is pruned. */
    convex_hull_add(&hull, 3, -3);

    if (convex_hull_query(&hull, 0) != -3) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }
    if (convex_hull_query(&hull, 1) != 0) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }
    if (convex_hull_query(&hull, 2) != 2) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }

    /* A new line with a larger slope can win for the current x. */
    convex_hull_add(&hull, 4, -20);
    if (convex_hull_query(&hull, 3) != -8) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }

    /* A line with the same slope wins only with a smaller intercept. */
    convex_hull_add(&hull, 4, -30);
    if (convex_hull_query(&hull, 3) != -18) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }
    convex_hull_add(&hull, 4, 0);
    if (convex_hull_query(&hull, 3) != -18) {
        convex_hull_destroy(&hull);
        return EXIT_FAILURE;
    }

    convex_hull_destroy(&hull);
    return EXIT_SUCCESS;
}
