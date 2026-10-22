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
 * A heavy-light decomposition of a tree rooted at one vertex: size[v] is the
 * number of vertices in the subtree of v, heavy[v] is the child of v with the
 * largest subtree, head[v] is the top of the chain of v and pos[v] is the
 * index of v in the flattened array.
 */
typedef struct {
    int n;
    int *parent;
    int *depth;
    int *size;
    int *heavy;
    int *head;
    int *pos;
    long long *flat;
    long long *prefix;
} hld_table;

/*
 * Ownership: hld_init allocates the storage and hld_destroy frees it. Every
 * successful init must be matched by exactly one destroy, and the
 * decomposition must not be used after that destroy. The adjacency list and
 * the values array belong to the caller and are only read while the
 * decomposition is built.
 */
static void hld_destroy(hld_table *h);

static int hld_init(hld_table *h, const adjacency_list *adj, int n, int root,
                    const long long *values) {
    if (n <= 0 || root < 0 || root >= n) {
        return 0;
    }
    h->n = n;
    h->parent = malloc((size_t)n * sizeof *h->parent);
    h->depth = malloc((size_t)n * sizeof *h->depth);
    h->size = malloc((size_t)n * sizeof *h->size);
    h->heavy = malloc((size_t)n * sizeof *h->heavy);
    h->head = malloc((size_t)n * sizeof *h->head);
    h->pos = malloc((size_t)n * sizeof *h->pos);
    h->flat = malloc((size_t)n * sizeof *h->flat);
    h->prefix = malloc((size_t)(n + 1) * sizeof *h->prefix);
    int *order = malloc((size_t)n * sizeof *order);
    if (h->parent == NULL || h->depth == NULL || h->size == NULL ||
        h->heavy == NULL || h->head == NULL || h->pos == NULL ||
        h->flat == NULL || h->prefix == NULL || order == NULL) {
        hld_destroy(h);
        free(order);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        h->depth[v] = -1;
        h->size[v] = 1;
        h->heavy[v] = -1;
    }

    /* A breadth-first walk from the root fixes the parents and the depths. */
    h->parent[root] = root;
    h->depth[root] = 0;
    int head = 0;
    int tail = 0;
    order[tail++] = root;
    while (head < tail) {
        const int u = order[head++];
        for (int i = 0; i < adj[u].degree; i++) {
            const int w = adj[u].neighbors[i];
            if (h->depth[w] != -1) {
                /* The vertex was already reached through another edge. */
                continue;
            }
            h->depth[w] = h->depth[u] + 1;
            h->parent[w] = u;
            order[tail++] = w;
        }
    }

    /*
     * The subtree sizes are known from the leaves upwards, and the heavy
     * child of a vertex is the child with the largest subtree.
     */
    for (int i = tail - 1; i >= 0; i--) {
        const int u = order[i];
        for (int j = 0; j < adj[u].degree; j++) {
            const int w = adj[u].neighbors[j];
            if (w == u || h->parent[w] != u) {
                /* The vertex is not a child of u. */
                continue;
            }
            h->size[u] += h->size[w];
            if (h->heavy[u] == -1 || h->size[w] > h->size[h->heavy[u]]) {
                h->heavy[u] = w;
            }
        }
    }

    /*
     * The flattened array holds one chain after the other, so the vertices
     * of a chain occupy a contiguous range of indices.
     */
    int timer = 0;
    for (int i = 0; i < tail; i++) {
        const int v = order[i];
        if (v != root && h->heavy[h->parent[v]] == v) {
            /* The vertex continues the chain of its parent. */
            continue;
        }
        for (int u = v; u != -1; u = h->heavy[u]) {
            h->head[u] = v;
            h->pos[u] = timer;
            h->flat[timer] = values[u];
            timer++;
        }
    }

    /*
     * The prefix sums turn every chain segment into a single subtraction, so
     * a path query costs one step per chain instead of a segment tree walk.
     */
    h->prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        h->prefix[i + 1] = h->prefix[i] + h->flat[i];
    }

    free(order);
    return 1;
}

static void hld_destroy(hld_table *h) {
    free(h->parent);
    free(h->depth);
    free(h->size);
    free(h->heavy);
    free(h->head);
    free(h->pos);
    free(h->flat);
    free(h->prefix);
    h->parent = NULL;
    h->depth = NULL;
    h->size = NULL;
    h->heavy = NULL;
    h->head = NULL;
    h->pos = NULL;
    h->flat = NULL;
    h->prefix = NULL;
    h->n = 0;
}

/* The sum of the values of the vertices on the path from u to v. */
static long long hld_path_sum(const hld_table *h, int u, int v) {
    if (u < 0 || u >= h->n || v < 0 || v >= h->n) {
        return 0;
    }
    if (h->depth[u] < 0 || h->depth[v] < 0) {
        /* A vertex outside the component of the root lies on no path. */
        return 0;
    }

    long long total = 0;
    while (h->head[u] != h->head[v]) {
        if (h->depth[h->head[u]] < h->depth[h->head[v]]) {
            const int swap = u;
            u = v;
            v = swap;
        }
        /* The chain of u is a contiguous range of the flattened array. */
        const int top = h->head[u];
        total += h->prefix[h->pos[u] + 1] - h->prefix[h->pos[top]];
        u = h->parent[top];
    }
    if (h->depth[u] > h->depth[v]) {
        const int swap = u;
        u = v;
        v = swap;
    }
    total += h->prefix[h->pos[v] + 1] - h->prefix[h->pos[u]];
    return total;
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

    /* The value of the vertex i is i + 1, so the vertex 0 has the value 1. */
    long long *values = malloc((size_t)(n > 0 ? n : 1) * sizeof *values);
    if (values == NULL) {
        adjacency_free(adj, n);
        free(cursor);
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }
    for (int v = 0; v < n; v++) {
        values[v] = (long long)v + 1;
    }

    hld_table h;
    const int built = hld_init(&h, adj, n, 0, values);
    free(values);

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
        printf("%lld\n", built ? hld_path_sum(&h, u, v) : 0);
    }

    if (built) {
        hld_destroy(&h);
    }
    adjacency_free(adj, n);
    free(cursor);
    free(edge_u);
    free(edge_v);
    free(degree);
    return 0;
}
