#include <stdio.h>
#include <stdlib.h>

/*
 * An adjacency list for a graph on vertices 0..n-1: neighbours lists the
 * adjacent vertex indices and degree is their count.
 */
typedef struct {
    int *neighbours;
    int degree;
} adjacency_list;

/**
 * Depth-first search over an unweighted graph: the stack replaces the
 * call stack, so a chain of any length is traversed without recursion.
 *
 * adj     adjacency list of the graph
 * n       number of vertices, labelled 0..n-1
 * source  the start vertex
 * order   receives the visited vertices in visit order; room for n entries
 * returns the number of vertices visited, or 0 when source is out of range
 */
static int dfs_reachable(const adjacency_list *adj, int n, int source, int *order) {
    if (n <= 0 || source < 0 || source >= n) {
        return 0;
    }

    /* One slot per possible push: the source plus one per edge end. */
    size_t capacity = 1;
    for (int v = 0; v < n; v++) {
        capacity += (size_t)adj[v].degree;
    }

    int *stack = malloc(capacity * sizeof *stack);
    char *visited = calloc((size_t)n, sizeof *visited);
    if (stack == NULL || visited == NULL) {
        free(stack);
        free(visited);
        return 0;
    }

    int top = 0;
    int count = 0;
    stack[top++] = source;

    while (top > 0) {
        const int v = stack[--top];
        if (visited[v]) {
            /* The vertex was already reached through another edge. */
            continue;
        }
        visited[v] = 1;
        order[count++] = v;

        for (int i = 0; i < adj[v].degree; i++) {
            const int w = adj[v].neighbours[i];
            if (!visited[w]) {
                stack[top++] = w;
            }
        }
    }

    free(stack);
    free(visited);
    return count;
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n\n");
        return 0;
    }

    int *edge_u = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_u);
    int *edge_v = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_v);
    int *degree = calloc((size_t)n, sizeof *degree);
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

    int source = -1;
    if (scanf("%d", &source) != 1) {
        source = -1;
    }

    adjacency_list *adj = calloc((size_t)n, sizeof *adj);
    int *cursor = calloc((size_t)n, sizeof *cursor);
    int *order = malloc((size_t)n * sizeof *order);
    char *reachable = calloc((size_t)n, sizeof *reachable);
    if (adj == NULL || cursor == NULL || order == NULL || reachable == NULL) {
        free(adj);
        free(cursor);
        free(order);
        free(reachable);
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        adj[v].neighbours = malloc((size_t)(degree[v] > 0 ? degree[v] : 1) * sizeof(int));
        adj[v].degree = degree[v];
    }
    for (int i = 0; i < kept; i++) {
        const int u = edge_u[i];
        const int v = edge_v[i];
        adj[u].neighbours[cursor[u]++] = v;
        adj[v].neighbours[cursor[v]++] = u;
    }

    const int count = dfs_reachable(adj, n, source, order);
    for (int i = 0; i < count; i++) {
        reachable[order[i]] = 1;
    }

    printf("%d\n", count);
    int first = 1;
    for (int v = 0; v < n; v++) {
        if (!reachable[v]) {
            continue;
        }
        if (!first) {
            putchar(' ');
        }
        printf("%d", v);
        first = 0;
    }
    putchar('\n');

    for (int v = 0; v < n; v++) {
        free(adj[v].neighbours);
    }
    free(adj);
    free(cursor);
    free(order);
    free(reachable);
    free(edge_u);
    free(edge_v);
    free(degree);
    return 0;
}
