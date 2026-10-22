#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * An adjacency list of a tree on the vertices 0..n-1: neighbors lists the
 * adjacent vertex indices and degree is their count.
 */
typedef struct {
    int *neighbors;
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
static int lca_init(lca_table *table, const adjacency_list *adj, int n, int root) {
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
            const int w = adj[u].neighbors[i];
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

static void lca_destroy(lca_table *table) {
    free(table->depth);
    free(table->up);
    table->depth = NULL;
    table->up = NULL;
    table->n = 0;
    table->levels = 0;
}

/* The lowest common ancestor of u and v. */
static int lca_query(const lca_table *table, int u, int v) {
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

/* Releases the neighbor lists of the adjacency list. */
static void adjacency_free(adjacency_list *adj, int n) {
    for (int v = 0; v < n; v++) {
        free(adj[v].neighbors);
    }
    free(adj);
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
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (m < 0) {
        m = 0;
    }

    /* The edges are read first, so every neighbor list is allocated once. */
    int *edge_u = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_u);
    int *edge_v = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_v);
    int *degree = calloc((size_t)(n > 0 ? n : 1), sizeof *degree);
    if (edge_u == NULL || edge_v == NULL || degree == NULL) {
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edge_u[kept] = u;
        edge_v[kept] = v;
        kept++;
        degree[u]++;
        degree[v]++;
    }

    adjacency_list *adj = calloc((size_t)(n > 0 ? n : 1), sizeof *adj);
    int *cursor = calloc((size_t)(n > 0 ? n : 1), sizeof *cursor);
    if (adj == NULL || cursor == NULL) {
        free(edge_u);
        free(edge_v);
        free(degree);
        free(adj);
        free(cursor);
        return 0;
    }
    for (int v = 0; v < n; v++) {
        adj[v].degree = degree[v];
        if (degree[v] > 0) {
            adj[v].neighbors = malloc((size_t)degree[v] * sizeof(int));
            if (adj[v].neighbors == NULL) {
                for (int u = 0; u < n; u++) {
                    free(adj[u].neighbors);
                }
                free(adj);
                free(cursor);
                free(edge_u);
                free(edge_v);
                free(degree);
                return 0;
            }
        }
    }
    for (int i = 0; i < kept; i++) {
        const int u = edge_u[i];
        const int v = edge_v[i];
        adj[u].neighbors[cursor[u]++] = v;
        adj[v].neighbors[cursor[v]++] = u;
    }

    lca_table table;
    const int built = lca_init(&table, adj, n, 0);

    int q = 0;
    if (scanf("%d", &q) != 1) {
        q = 0;
    }
    for (int k = 0; k < q; k++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        printf("%d\n", built ? lca_query(&table, u, v) : -1);
    }

    if (built) {
        lca_destroy(&table);
    }
    adjacency_free(adj, n);
    free(cursor);
    free(edge_u);
    free(edge_v);
    free(degree);
    return 0;
}
