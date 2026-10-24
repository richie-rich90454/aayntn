#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int *head;
static int *tail;
static int *destination;
static int *nextEdge;
static int *onPath;
static int edgeCount;
static long long expanded;
static int target;

static int depthLimitedSearch(int vertex, int depth, int limit) {
    onPath[vertex] = 1;
    expanded += 1;
    if (vertex == target) {
        return 1;
    }
    if (depth == limit) {
        onPath[vertex] = 0;
        return 0;
    }
    for (int edge = head[vertex]; edge != -1; edge = nextEdge[edge]) {
        int neighbor = destination[edge];
        if (!onPath[neighbor] && depthLimitedSearch(neighbor, depth + 1, limit)) {
            return 1;
        }
    }
    onPath[vertex] = 0;
    return 0;
}

static void addEdge(int from, int to) {
    destination[edgeCount] = to;
    nextEdge[edgeCount] = -1;
    if (head[from] == -1) {
        head[from] = edgeCount;
    } else {
        nextEdge[tail[from]] = edgeCount;
    }
    tail[from] = edgeCount;
    edgeCount += 1;
}

int main(void) {
    int n;
    int m;
    int start;
    if (scanf("%d %d %d %d", &n, &m, &start, &target) != 4) {
        return 0;
    }
    if (n < 1 || m < 0 || start < 1 || start > n || target < 1 || target > n) {
        return 0;
    }

    head = malloc((size_t)(n + 1) * sizeof(int));
    tail = malloc((size_t)(n + 1) * sizeof(int));
    onPath = malloc((size_t)(n + 1) * sizeof(int));
    destination = malloc((size_t)(2 * m) * sizeof(int));
    nextEdge = malloc((size_t)(2 * m) * sizeof(int));
    if (
        head == NULL || tail == NULL || onPath == NULL ||
        (m > 0 && (destination == NULL || nextEdge == NULL))
    ) {
        free(head);
        free(tail);
        free(onPath);
        free(destination);
        free(nextEdge);
        return 0;
    }

    for (int i = 1; i <= n; ++i) {
        head[i] = -1;
        tail[i] = -1;
    }
    edgeCount = 0;
    for (int i = 0; i < m; ++i) {
        int u;
        int v;
        if (scanf("%d %d", &u, &v) != 2 || u < 1 || u > n || v < 1 || v > n) {
            free(head);
            free(tail);
            free(onPath);
            free(destination);
            free(nextEdge);
            return 0;
        }
        addEdge(u, v);
        addEdge(v, u);
    }

    int answer = -1;
    for (int limit = 0; limit < n; ++limit) {
        memset(onPath, 0, (size_t)(n + 1) * sizeof(int));
        if (depthLimitedSearch(start, 0, limit)) {
            answer = limit;
            break;
        }
    }

    printf("%d %lld\n", answer, expanded);

    free(head);
    free(tail);
    free(onPath);
    free(destination);
    free(nextEdge);
    return 0;
}
