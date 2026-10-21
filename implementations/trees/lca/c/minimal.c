#include <stdlib.h>

/*
 * An adjacency list of a tree on the vertices 0..n-1: neighbours lists the
 * adjacent vertex indices and degree is their count.
 */
typedef struct {
    int *neighbours;
    int degree;
} adjacency_list;

/*
 * A binary-lifting table for a tree rooted at one vertex: up[k * n + v] is
 * the ancestor of v that lies 2^k edges above it, and depth[v] is the number
 * of edges from the root to v.
 */
typedef struct {
    int n;
    int levels;
    int *depth;
    int *up;
} lca_table;

/*
 * Ownership: lca_init allocates the storage and lca_destroy frees it. Every
 * successful init must be matched by exactly one destroy, and the table must
 * not be used after that destroy. The adjacency list belongs to the caller and
 * is only read while the table is built.
 */
int lca_init(lca_table *table, const adjacency_list *adj, int n, int root) {
    if (n <= 0 || root < 0 || root >= n) {
        return 0;
    }

    int levels = 1;
    while ((1 << levels) <= n) {
        levels++;
    }

    table->n = n;
    table->levels = levels;
    table->depth = malloc((size_t)n * sizeof *table->depth);
    table->up = malloc((size_t)levels * (size_t)n * sizeof *table->up);
    int *queue = malloc((size_t)n * sizeof *queue);
    if (table->depth == NULL || table->up == NULL || queue == NULL) {
        free(table->depth);
        free(table->up);
        free(queue);
        table->depth = NULL;
        table->up = NULL;
        table->n = 0;
        table->levels = 0;
        return 0;
    }
    for (int v = 0; v < n; v++) {
        table->depth[v] = -1;
    }

    /* The root is its own ancestor, so the table stays defined everywhere. */
    table->up[root] = root;
    table->depth[root] = 0;

    int head = 0;
    int tail = 0;
    queue[tail++] = root;
    while (head < tail) {
        const int u = queue[head++];
        for (int i = 0; i < adj[u].degree; i++) {
            const int w = adj[u].neighbours[i];
            if (table->depth[w] != -1) {
                /* The vertex was already reached through another edge. */
                continue;
            }
            table->depth[w] = table->depth[u] + 1;
            table->up[w] = u;
            queue[tail++] = w;
        }
    }
    free(queue);

    /* The table of the 2^k ancestors is built from the table of the 2^(k-1). */
    for (int k = 1; k < levels; k++) {
        for (int v = 0; v < n; v++) {
            const int middle = table->up[(size_t)(k - 1) * (size_t)n + v];
            table->up[(size_t)k * (size_t)n + v] =
                table->up[(size_t)(k - 1) * (size_t)n + middle];
        }
    }
    return 1;
}

void lca_destroy(lca_table *table) {
    free(table->depth);
    free(table->up);
    table->depth = NULL;
    table->up = NULL;
    table->n = 0;
    table->levels = 0;
}

/* The ancestor of v that lies 2^k edges above it. */
int lca_lift(const lca_table *table, int v, int k) {
    if (v < 0 || v >= table->n) {
        return -1;
    }
    if (k < 0) {
        k = 0;
    }
    if (k >= table->levels) {
        k = table->levels - 1;
    }
    return table->up[(size_t)k * (size_t)table->n + v];
}

/* The number of edges from the root to v. */
int lca_depth(const lca_table *table, int v) {
    if (v < 0 || v >= table->n) {
        return -1;
    }
    return table->depth[v];
}

/* The lowest common ancestor of u and v. */
int lca_query(const lca_table *table, int u, int v) {
    if (u < 0 || u >= table->n || v < 0 || v >= table->n) {
        return -1;
    }
    if (table->depth[u] < 0 || table->depth[v] < 0) {
        /* A vertex outside the component of the root has no ancestor. */
        return -1;
    }
    if (table->depth[u] < table->depth[v]) {
        const int swap = u;
        u = v;
        v = swap;
    }

    /* Lift the deeper vertex until both stand at the same depth. */
    int difference = table->depth[u] - table->depth[v];
    for (int k = 0; k < table->levels; k++) {
        if ((difference >> k) & 1) {
            u = table->up[(size_t)k * (size_t)table->n + u];
        }
    }
    if (u == v) {
        return u;
    }

    /*
     * From the largest jump downwards, the two vertices either stay together
     * or they both move one step below the common ancestor.
     */
    for (int k = table->levels - 1; k >= 0; k--) {
        const int ancestor_u = table->up[(size_t)k * (size_t)table->n + u];
        const int ancestor_v = table->up[(size_t)k * (size_t)table->n + v];
        if (ancestor_u != ancestor_v) {
            u = ancestor_u;
            v = ancestor_v;
        }
    }
    return table->up[u];
}

/*
 * Self-check only: the routines above are the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    int neighbours_of_0[] = {1, 2};
    int neighbours_of_1[] = {0, 3, 4};
    int neighbours_of_2[] = {0};
    int neighbours_of_3[] = {1};
    int neighbours_of_4[] = {1};
    adjacency_list adj[5];
    adj[0].neighbours = neighbours_of_0;
    adj[0].degree = 2;
    adj[1].neighbours = neighbours_of_1;
    adj[1].degree = 3;
    adj[2].neighbours = neighbours_of_2;
    adj[2].degree = 1;
    adj[3].neighbours = neighbours_of_3;
    adj[3].degree = 1;
    adj[4].neighbours = neighbours_of_4;
    adj[4].degree = 1;

    lca_table table;
    if (!lca_init(&table, adj, 5, 0)) {
        return EXIT_FAILURE;
    }

    if (lca_query(&table, 3, 4) != 1) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }
    if (lca_query(&table, 2, 3) != 0) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }
    if (lca_query(&table, 0, 4) != 0) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }
    /* A vertex is its own lowest common ancestor. */
    if (lca_query(&table, 3, 3) != 3) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }

    if (lca_depth(&table, 0) != 0 || lca_depth(&table, 1) != 1 ||
        lca_depth(&table, 3) != 2) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }
    if (lca_lift(&table, 3, 0) != 1 || lca_lift(&table, 3, 1) != 0) {
        lca_destroy(&table);
        return EXIT_FAILURE;
    }

    lca_destroy(&table);
    return EXIT_SUCCESS;
}
