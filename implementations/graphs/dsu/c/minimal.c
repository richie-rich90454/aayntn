#include <stdlib.h>

/*
 * A disjoint set over the elements 0..n-1: parent holds the representative of
 * every element and size holds the number of elements of the set it
 * represents.
 */
typedef struct {
    int *parent;
    int *size;
} disjoint_set;

void dsu_destroy(disjoint_set *set) {
    free(set->parent);
    free(set->size);
    set->parent = NULL;
    set->size = NULL;
}

/*
 * Ownership: dsu_init allocates the arrays and dsu_destroy frees them. Every
 * successful init must be matched by exactly one destroy, and the structure
 * must not be used after that destroy.
 */
int dsu_init(disjoint_set *set, int n) {
    set->parent = NULL;
    set->size = NULL;
    if (n <= 0) {
        return 1;
    }
    set->parent = malloc((size_t)n * sizeof *set->parent);
    set->size = malloc((size_t)n * sizeof *set->size);
    if (set->parent == NULL || set->size == NULL) {
        dsu_destroy(set);
        return 0;
    }
    for (int i = 0; i < n; i++) {
        set->parent[i] = i;
        set->size[i] = 1;
    }
    return 1;
}

/* The representative of the set holding x, compressing the path to it. */
int dsu_find(disjoint_set *set, int x) {
    int root = x;
    while (set->parent[root] != root) {
        root = set->parent[root];
    }
    /* Every element on the path now points at the root. */
    while (set->parent[x] != x) {
        const int next = set->parent[x];
        set->parent[x] = root;
        x = next;
    }
    return root;
}

/* Merges the sets holding a and b. */
void dsu_unite(disjoint_set *set, int a, int b) {
    int root_a = dsu_find(set, a);
    int root_b = dsu_find(set, b);
    if (root_a == root_b) {
        return;
    }
    /* The larger set absorbs the smaller one, which keeps the trees shallow. */
    if (set->size[root_a] < set->size[root_b]) {
        const int swap = root_a;
        root_a = root_b;
        root_b = swap;
    }
    set->parent[root_b] = root_a;
    set->size[root_a] += set->size[root_b];
}

/* Whether a and b belong to the same set. */
int dsu_same(disjoint_set *set, int a, int b) {
    return dsu_find(set, a) == dsu_find(set, b);
}

/*
 * Self-check only: the routines above are the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    disjoint_set set;
    if (!dsu_init(&set, 5)) {
        return EXIT_FAILURE;
    }

    int ok = 1;
    dsu_unite(&set, 0, 1);
    dsu_unite(&set, 2, 3);
    ok &= dsu_same(&set, 0, 1);
    ok &= !dsu_same(&set, 0, 2);
    ok &= !dsu_same(&set, 0, 3);
    ok &= dsu_find(&set, 0) == dsu_find(&set, 1);
    ok &= dsu_find(&set, 0) != dsu_find(&set, 2);

    dsu_unite(&set, 1, 3);
    ok &= dsu_same(&set, 0, 3);
    ok &= dsu_same(&set, 2, 3);
    ok &= !dsu_same(&set, 0, 4);

    dsu_destroy(&set);
    return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
