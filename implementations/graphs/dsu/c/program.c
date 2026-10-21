#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A disjoint set over the elements 0..n-1: parent holds the representative of
 * every element and size holds the number of elements of the set it
 * represents.
 */
typedef struct {
    int *parent;
    int *size;
} disjoint_set;

static void dsu_destroy(disjoint_set *set) {
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
static int dsu_init(disjoint_set *set, int n) {
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
static int dsu_find(disjoint_set *set, int x) {
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
static void dsu_unite(disjoint_set *set, int a, int b) {
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
static int dsu_same(disjoint_set *set, int a, int b) {
    return dsu_find(set, a) == dsu_find(set, b);
}

int main(void) {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (q < 0) {
        q = 0;
    }

    disjoint_set set;
    if (!dsu_init(&set, n)) {
        return 0;
    }

    for (int i = 0; i < q; i++) {
        int type = 0;
        int u = 0;
        int v = 0;
        if (scanf("%d %d %d", &type, &u, &v) != 3) {
            break;
        }
        const int valid = u >= 0 && u < n && v >= 0 && v < n;
        if (type == 1) {
            if (valid) {
                dsu_unite(&set, u, v);
            }
        } else if (type == 2) {
            printf("%s\n", valid && dsu_same(&set, u, v) ? "yes" : "no");
        }
    }

    dsu_destroy(&set);
    return 0;
}
