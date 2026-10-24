#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/* A weighted adjacency list in compressed form. */
typedef struct {
    int *head;
    int *to;
    int *next;
    long long *weight;
    int count;
} graph;

/* The ancestor table and the preorder interval of every vertex. */
typedef struct {
    int n;
    int levels;
    int *parent;
    int *depth;
    int *tin;
    int *tout;
    long long *distance;
    int *up;
} tree;

static int graph_build(graph *g, int n, int m) {
    g->head = NULL;
    g->to = NULL;
    g->next = NULL;
    g->weight = NULL;
    g->count = 0;
    if (m > INT_MAX / 2) {
        return 0;
    }
    const int vertices = n > 0 ? n : 1;
    const int edges = 2 * (m > 0 ? m : 1);
    g->head = malloc((size_t)vertices * sizeof *g->head);
    g->to = malloc((size_t)edges * sizeof *g->to);
    g->next = malloc((size_t)edges * sizeof *g->next);
    g->weight = malloc((size_t)edges * sizeof *g->weight);
    if (g->head == NULL || g->to == NULL || g->next == NULL || g->weight == NULL) {
        free(g->head);
        free(g->to);
        free(g->next);
        free(g->weight);
        g->head = NULL;
        g->to = NULL;
        g->next = NULL;
        g->weight = NULL;
        return 0;
    }
    for (int v = 0; v < n; v++) {
        g->head[v] = -1;
    }
    return 1;
}

static void graph_add(graph *g, int u, int v, long long w) {
    g->to[g->count] = v;
    g->weight[g->count] = w;
    g->next[g->count] = g->head[u];
    g->head[u] = g->count;
    g->count++;
}

static int tree_build(tree *t, const graph *g, int n) {
    t->n = n;
    t->levels = 1;
    while ((1 << t->levels) <= n) {
        t->levels++;
    }
    t->parent = NULL;
    t->depth = NULL;
    t->tin = NULL;
    t->tout = NULL;
    t->distance = NULL;
    t->up = NULL;
    if (n <= 0) {
        return 1;
    }

    const int size = n;
    t->parent = malloc((size_t)size * sizeof *t->parent);
    t->depth = malloc((size_t)size * sizeof *t->depth);
    t->tin = malloc((size_t)size * sizeof *t->tin);
    t->tout = malloc((size_t)size * sizeof *t->tout);
    t->distance = malloc((size_t)size * sizeof *t->distance);
    t->up = malloc((size_t)t->levels * (size_t)size * sizeof *t->up);
    int *cursor = malloc((size_t)size * sizeof *cursor);
    int *stack = malloc((size_t)size * sizeof *stack);
    if (t->parent == NULL || t->depth == NULL || t->tin == NULL || t->tout == NULL ||
        t->distance == NULL || t->up == NULL || cursor == NULL || stack == NULL) {
        free(t->parent);
        free(t->depth);
        free(t->tin);
        free(t->tout);
        free(t->distance);
        free(t->up);
        free(cursor);
        free(stack);
        t->parent = NULL;
        t->depth = NULL;
        t->tin = NULL;
        t->tout = NULL;
        t->distance = NULL;
        t->up = NULL;
        return 0;
    }
    for (int v = 0; v < n; v++) {
        t->parent[v] = -1;
        t->depth[v] = -1;
        t->tin[v] = -1;
        t->tout[v] = -1;
        t->distance[v] = 0;
        cursor[v] = g->head[v];
    }

    /*
     * One iterative depth-first walk fixes the parent, the edge depth, the
     * weighted distance and the preorder interval of every reachable vertex.
     */
    t->parent[0] = 0;
    t->depth[0] = 0;
    t->tin[0] = 0;
    int timer = 1;
    int top = 0;
    stack[0] = 0;
    while (top >= 0) {
        const int v = stack[top];
        int e = cursor[v];
        while (e != -1 && t->parent[g->to[e]] != -1) {
            e = g->next[e];
        }
        cursor[v] = e;
        if (e == -1) {
            t->tout[v] = timer;
            top--;
            continue;
        }
        cursor[v] = g->next[e];
        const int u = g->to[e];
        t->parent[u] = v;
        t->depth[u] = t->depth[v] + 1;
        t->distance[u] = t->distance[v] + g->weight[e];
        t->tin[u] = timer;
        timer++;
        top++;
        stack[top] = u;
    }
    free(cursor);
    free(stack);

    /* The root is its own ancestor, so every entry of the table is defined. */
    for (int v = 0; v < n; v++) {
        t->up[v] = t->parent[v] >= 0 ? t->parent[v] : v;
    }
    for (int k = 1; k < t->levels; k++) {
        for (int v = 0; v < n; v++) {
            const int middle = t->up[(k - 1) * n + v];
            t->up[k * n + v] = t->up[(k - 1) * n + middle];
        }
    }
    return 1;
}

static void tree_destroy(tree *t) {
    free(t->parent);
    free(t->depth);
    free(t->tin);
    free(t->tout);
    free(t->distance);
    free(t->up);
    t->parent = NULL;
    t->depth = NULL;
    t->tin = NULL;
    t->tout = NULL;
    t->distance = NULL;
    t->up = NULL;
}

static int lca_query(const tree *t, int u, int v) {
    if (u < 0 || u >= t->n || v < 0 || v >= t->n) {
        return -1;
    }
    if (t->depth[u] < 0 || t->depth[v] < 0) {
        return -1;
    }
    if (t->depth[u] < t->depth[v]) {
        const int swap = u;
        u = v;
        v = swap;
    }
    int difference = t->depth[u] - t->depth[v];
    for (int k = 0; difference > 0; k++) {
        if ((difference & 1) != 0) {
            u = t->up[k * t->n + u];
        }
        difference >>= 1;
    }
    if (u == v) {
        return u;
    }
    for (int k = t->levels - 1; k >= 0; k--) {
        const int ancestor_u = t->up[k * t->n + u];
        const int ancestor_v = t->up[k * t->n + v];
        if (ancestor_u != ancestor_v) {
            u = ancestor_u;
            v = ancestor_v;
        }
    }
    return t->up[u];
}

/* Whether u lies on the path from the root to v. */
static int is_ancestor(const tree *t, int u, int v) {
    return t->tin[u] <= t->tin[v] && t->tin[v] < t->tout[u];
}

static const int *sort_tin;

static int compare_vertex(const void *a, const void *b) {
    const int u = *(const int *)a;
    const int v = *(const int *)b;
    return (sort_tin[u] > sort_tin[v]) - (sort_tin[u] < sort_tin[v]);
}

int main(void) {
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

    graph g;
    if (!graph_build(&g, n, m)) {
        return 1;
    }
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (scanf("%d %d %lld", &u, &v, &w) != 3) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        graph_add(&g, u, v, w);
        graph_add(&g, v, u, w);
    }

    tree t;
    if (!tree_build(&t, &g, n)) {
        free(g.head);
        free(g.to);
        free(g.next);
        free(g.weight);
        return 1;
    }

    int q = 0;
    if (scanf("%d", &q) != 1) {
        q = 0;
    }
    if (q < 0) {
        q = 0;
    }

    const int capacity = n > 0 ? n : 1;
    int *marks = malloc((size_t)capacity * sizeof *marks);
    int *nodes = malloc((size_t)(2 * (size_t)capacity + 1) * sizeof *nodes);
    int *stack = malloc((size_t)(2 * (size_t)capacity + 1) * sizeof *stack);
    int *stamp = calloc((size_t)capacity, sizeof *stamp);
    if (marks == NULL || nodes == NULL || stack == NULL || stamp == NULL) {
        free(marks);
        free(nodes);
        free(stack);
        free(stamp);
        tree_destroy(&t);
        free(g.head);
        free(g.to);
        free(g.next);
        free(g.weight);
        return 1;
    }
    sort_tin = t.tin;

    int query_id = 0;
    for (int query = 0; query < q; query++) {
        int k = 0;
        if (scanf("%d", &k) != 1) {
            break;
        }
        if (k < 0) {
            k = 0;
        }
        query_id++;
        int count = 0;
        for (int i = 0; i < k; i++) {
            int v = -1;
            if (scanf("%d", &v) != 1) {
                break;
            }
            if (v >= 0 && v < n && t.depth[v] >= 0 && stamp[v] != query_id) {
                stamp[v] = query_id;
                marks[count] = v;
                count++;
            }
        }
        if (count < 2) {
            printf("0\n");
            continue;
        }

        qsort(marks, (size_t)count, sizeof *marks, compare_vertex);

        int total_nodes = count;
        for (int i = 0; i < count; i++) {
            nodes[i] = marks[i];
        }
        for (int i = 0; i + 1 < count; i++) {
            const int ancestor = lca_query(&t, marks[i], marks[i + 1]);
            if (ancestor >= 0) {
                nodes[total_nodes] = ancestor;
                total_nodes++;
            }
        }
        qsort(nodes, (size_t)total_nodes, sizeof *nodes, compare_vertex);

        int unique = 0;
        for (int i = 0; i < total_nodes; i++) {
            if (unique == 0 || nodes[i] != nodes[unique - 1]) {
                nodes[unique] = nodes[i];
                unique++;
            }
        }

        long long total = 0;
        int top = 0;
        for (int i = 0; i < unique; i++) {
            const int v = nodes[i];
            while (top > 0 && !is_ancestor(&t, stack[top - 1], v)) {
                top--;
            }
            if (top > 0) {
                total += t.distance[v] - t.distance[stack[top - 1]];
            }
            stack[top] = v;
            top++;
        }
        printf("%lld\n", total);
    }

    free(marks);
    free(nodes);
    free(stack);
    free(stamp);
    tree_destroy(&t);
    free(g.head);
    free(g.to);
    free(g.next);
    free(g.weight);
    return 0;
}
