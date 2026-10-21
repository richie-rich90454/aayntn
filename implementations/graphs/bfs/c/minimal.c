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
 * Breadth-first search from source over an unweighted graph.
 *
 * The queue holds the frontier, so the vertices leave it in order of
 * increasing distance from source: the first time a vertex is discovered its
 * distance is already the length of a shortest path to it.
 *
 * adj       adjacency list of the graph
 * n         number of vertices, labeled 0..n-1
 * source    the start vertex
 * distance  receives the distance from source to every vertex and -1 for the
 *           vertices source cannot reach; room for n entries
 */
void bfs_distances(const adjacency_list *adj, int n, int source, int *distance) {
    for (int v = 0; v < n; v++) {
        distance[v] = -1;
    }
    if (n <= 0 || source < 0 || source >= n) {
        return;
    }

    int *queue = malloc((size_t)n * sizeof *queue);
    if (queue == NULL) {
        return;
    }

    int head = 0;
    int tail = 0;
    queue[tail++] = source;
    distance[source] = 0;

    while (head < tail) {
        const int v = queue[head++];
        for (int i = 0; i < adj[v].degree; i++) {
            const int w = adj[v].neighbours[i];
            if (distance[w] >= 0) {
                /* The vertex was already discovered. */
                continue;
            }
            distance[w] = distance[v] + 1;
            queue[tail++] = w;
        }
    }

    free(queue);
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2) {
        return 0;
    }
    if (n <= 0) {
        printf("\n");
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
    int *distance = malloc((size_t)n * sizeof *distance);
    if (adj == NULL || cursor == NULL || distance == NULL) {
        free(adj);
        free(cursor);
        free(distance);
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

    bfs_distances(adj, n, source, distance);

    for (int v = 0; v < n; v++) {
        if (v > 0) {
            putchar(' ');
        }
        printf("%d", distance[v]);
    }
    putchar('\n');

    for (int v = 0; v < n; v++) {
        free(adj[v].neighbours);
    }
    free(adj);
    free(cursor);
    free(distance);
    free(edge_u);
    free(edge_v);
    free(degree);
    return 0;
}
