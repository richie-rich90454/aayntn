#include <stdio.h>
#include <stdlib.h>

/**
 * The two-coloring test for an undirected graph read from standard input.
 *
 * Input: n m, then m lines u v (0-based, undirected).
 * Output: the color of every vertex, 0 or 1, separated by spaces, or the single
 * line -1 when the graph is not bipartite.
 *
 * A vertex receives the opposite color of the vertex that discovered it, so
 * its color is the parity of its breadth-first distance from the root of its
 * component. The test fails when an edge joins two vertices of the same
 * parity, because that edge closes an odd cycle.
 */

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
    if (m < 0) {
        m = 0;
    }

    int *head = malloc((size_t)n * sizeof *head);
    int *color = malloc((size_t)n * sizeof *color);
    int *queue = malloc((size_t)n * sizeof *queue);
    const size_t capacity = (size_t)m * 2 > 0 ? (size_t)m * 2 : 1;
    int *destination = malloc(capacity * sizeof *destination);
    int *next_edge = malloc(capacity * sizeof *next_edge);
    if (head == NULL || color == NULL || queue == NULL || destination == NULL ||
        next_edge == NULL) {
        free(head);
        free(color);
        free(queue);
        free(destination);
        free(next_edge);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        head[v] = -1;
        color[v] = -1;
    }

    int edges = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        destination[edges] = v;
        next_edge[edges] = head[u];
        head[u] = edges;
        edges++;
        destination[edges] = u;
        next_edge[edges] = head[v];
        head[v] = edges;
        edges++;
    }

    int bipartite = 1;
    for (int s = 0; s < n && bipartite; s++) {
        if (color[s] != -1) {
            continue;
        }
        color[s] = 0;
        int front = 0;
        int back = 0;
        queue[back++] = s;
        while (front < back && bipartite) {
            const int u = queue[front++];
            for (int e = head[u]; e != -1; e = next_edge[e]) {
                const int v = destination[e];
                if (color[v] == -1) {
                    color[v] = color[u] ^ 1;
                    queue[back++] = v;
                } else if (color[v] == color[u]) {
                    /* The edge closes an odd cycle. */
                    bipartite = 0;
                    break;
                }
            }
        }
    }

    if (!bipartite) {
        printf("-1\n");
    } else {
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                putchar(' ');
            }
            printf("%d", color[v]);
        }
        putchar('\n');
    }

    free(head);
    free(color);
    free(queue);
    free(destination);
    free(next_edge);
    return 0;
}
