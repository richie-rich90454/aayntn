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

/*
 * Marks v as visited and recurses into the neighbours that are still
 * unvisited. The frame of this call stays on the stack for as long as the
 * subtree of v is explored, so the recursion depth equals the depth of the
 * current path.
 */
static void dfs_visit(const adjacency_list *adj, int v, char *visited, int *order, int *count) {
    visited[v] = 1;
    order[(*count)++] = v;

    for (int i = 0; i < adj[v].degree; i++) {
        const int w = adj[v].neighbours[i];
        if (!visited[w]) {
            dfs_visit(adj, w, visited, order, count);
        }
    }
}

/**
 * Depth-first search that marks a vertex on entry to the recursive call.
 *
 * Every vertex is entered at most once, so the auxiliary space is the
 * visited array plus one stack frame per vertex on the current path:
 * O(V) in total. The call stack can grow to the depth of the graph, which
 * overflows in C++ and Java on a long chain.
 *
 * adj     adjacency list of the graph
 * n       number of vertices, labeled 0..n-1
 * source  the start vertex
 * order   receives the visited vertices in visit order; room for n entries
 * returns the number of vertices visited, or 0 when source is out of range
 */
int dfs_recursive(const adjacency_list *adj, int n, int source, int *order) {
    if (n <= 0 || source < 0 || source >= n) {
        return 0;
    }

    char *visited = calloc((size_t)n, sizeof *visited);
    if (visited == NULL) {
        return 0;
    }

    int count = 0;
    dfs_visit(adj, source, visited, order, &count);
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

    const int count = dfs_recursive(adj, n, source, order);
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
